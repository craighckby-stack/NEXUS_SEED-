# recovered_notebook/cnn_training.py (V94.1 - Scalability and Robustness Update)

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, BatchNormalization, Activation
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau, TensorBoard
from tensorflow.keras import mixed_precision
from datetime import datetime
import argparse
import os
import math # Added for step calculation robustness

# --- Configuration Management ---
class TrainingConfig:
    """Standardized configuration holder, supporting argument override."""
    DATA_DIR = './data/custom_dataset'
    LOG_DIR = './logs'
    MODEL_NAME = 'sovereign_cnn_v94_1'
    IMG_SIZE = (224, 224)
    BATCH_SIZE = 64
    EPOCHS = 50
    LEARNING_RATE = 1e-4
    VALIDATION_SPLIT = 0.2
    DROPOUT_RATE = 0.3

def parse_args(config: TrainingConfig):
    """Parses command line arguments and updates the configuration."""
    parser = argparse.ArgumentParser(description="Sovereign CNN Training Script")
    parser.add_argument('--epochs', type=int, default=config.EPOCHS, help='Number of epochs')
    parser.add_argument('--lr', type=float, default=config.LEARNING_RATE, help='Initial learning rate')
    parser.add_argument('--batch_size', type=int, default=config.BATCH_SIZE, help='Batch size')
    parser.add_argument('--data_dir', type=str, default=config.DATA_DIR, help='Path to dataset directory')
    
    args = parser.parse_args()
    config.EPOCHS = args.epochs
    config.LEARNING_RATE = args.lr
    config.BATCH_SIZE = args.batch_size
    config.DATA_DIR = args.data_dir
    return config

def configure_environment(config: TrainingConfig):
    """Sets up device policy, distributed strategy, and logging."""
    print("Configuring TensorFlow Environment (v94.1)...")
    
    # 1. Distributed Strategy Check (Architectural enhancement)
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            
            if len(gpus) > 1:
                strategy = tf.distribute.MirroredStrategy()
                print(f"Using Mirrored Strategy for {len(gpus)} GPUs.")
            else:
                strategy = tf.distribute.get_strategy() # Default strategy (one device)
                print(f"Found and configured 1 GPU. Using default strategy.")
        except RuntimeError as e:
            print(f"GPU configuration error: {e}")
            strategy = tf.distribute.get_strategy()
    else:
        strategy = tf.distribute.get_strategy()
        print("No GPU detected. Using CPU/default strategy.")

    # 2. Mixed Precision Policy
    # Ensuring half-precision speeds up computation while using float32 output for numerical stability.
    policy = mixed_precision.Policy('mixed_float16')
    mixed_precision.set_global_policy(policy)
    print(f"Global Mixed Precision Policy set to: {policy.name}")
    
    return strategy

def load_data(config: TrainingConfig):
    """Loads and prepares data using generators with extensive augmentation.
       (Note: Keras generators are used for compatibility; tf.data pipelines preferred in V95+)
    """
    
    # Standard augmentation for robustness
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        rotation_range=20,
        width_shift_range=0.1,
        height_shift_range=0.1,
        validation_split=config.VALIDATION_SPLIT
    )
    
    # Only rescaling for validation/test data
    validation_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=config.VALIDATION_SPLIT
    )

    print(f"Attempting to load data from: {config.DATA_DIR}")
    
    train_generator = train_datagen.flow_from_directory(
        config.DATA_DIR,
        target_size=config.IMG_SIZE,
        batch_size=config.BATCH_SIZE,
        class_mode='categorical',
        subset='training'
    )

    validation_generator = validation_datagen.flow_from_directory(
        config.DATA_DIR,
        target_size=config.IMG_SIZE,
        batch_size=config.BATCH_SIZE,
        class_mode='categorical',
        subset='validation'
    )
    
    num_classes = train_generator.num_classes
    if num_classes < 2:
        raise ValueError(f"Dataset must contain at least 2 classes. Detected: {num_classes}")
        
    print(f"Classes detected: {train_generator.class_indices} ({num_classes} classes total)")
    return train_generator, validation_generator, num_classes

def define_model(input_shape, num_classes, optimizer_lr, dropout_rate):
    """Defines a scalable VGG-like CNN structure with Batch Normalization for stability.
       Metrics updated to track Precision and Recall for robustness (Sovereign refinement).
    """
    
    model = Sequential([
        # Block 1: 64 filters
        Conv2D(64, (3, 3), padding='same', input_shape=input_shape),
        BatchNormalization(),
        Activation('relu'),
        Conv2D(64, (3, 3), padding='same'),
        BatchNormalization(),
        Activation('relu'),
        MaxPooling2D((2, 2)),
        Dropout(dropout_rate),
        
        # Block 2: 128 filters
        Conv2D(128, (3, 3), padding='same'),
        BatchNormalization(),
        Activation('relu'),
        Conv2D(128, (3, 3), padding='same'),
        BatchNormalization(),
        Activation('relu'),
        MaxPooling2D((2, 2)),
        Dropout(dropout_rate),

        # Block 3: 256 filters
        Conv2D(256, (3, 3), padding='same'),
        BatchNormalization(),
        Activation('relu'),
        MaxPooling2D((2, 2)),
        
        Flatten(),
        
        # Dense Layers
        Dense(512),
        BatchNormalization(),
        Activation('relu'),
        Dropout(dropout_rate * 1.5), # Increased dropout for dense layers
        Dense(num_classes, activation='softmax', dtype='float32') # Output layer must use float32
    ], name="Sovereign_CNN_V94_Classifier")

    # Use a stronger optimizer and defined LR
    optimizer = tf.keras.optimizers.Adam(learning_rate=optimizer_lr)
    
    model.compile(optimizer=optimizer,
                  loss='categorical_crossentropy',
                  metrics=[
                      'accuracy',
                      tf.keras.metrics.Precision(name='precision'),
                      tf.keras.metrics.Recall(name='recall')
                  ])
    
    return model

def train_model(model, train_gen, val_gen, config: TrainingConfig, strategy):
    """Executes the training loop with enhanced callbacks and distributed strategy context."""
    
    # 1. Define Callbacks
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    run_log_dir = os.path.join(config.LOG_DIR, config.MODEL_NAME, timestamp)
    os.makedirs(run_log_dir, exist_ok=True)
    
    save_path = f'./models/{config.MODEL_NAME}'
    os.makedirs(save_path, exist_ok=True)
    
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True),
        ModelCheckpoint(filepath=os.path.join(save_path, 'best_model.h5'),
                        monitor='val_accuracy',
                        save_best_only=True,
                        verbose=1),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-7),
        TensorBoard(log_dir=run_log_dir, histogram_freq=1)
    ]
    
    # 2. Calculate steps
    # Use math.ceil for robust calculation ensuring all samples are processed, regardless of batch size remainder.
    steps_per_epoch = math.ceil(train_gen.samples / config.BATCH_SIZE)
    validation_steps = math.ceil(val_gen.samples / config.BATCH_SIZE)

    print(f"Training samples: {train_gen.samples}, Validation samples: {val_gen.samples}")
    print(f"Steps per epoch: {steps_per_epoch}, Validation steps: {validation_steps}")
    print(f"Starting training for {config.EPOCHS} epochs...")
    
    # 3. Training execution
    history = model.fit(
        train_gen,
        steps_per_epoch=steps_per_epoch,
        epochs=config.EPOCHS,
        validation_data=val_gen,
        validation_steps=validation_steps,
        callbacks=callbacks
    )
    
    # 4. Final Save
    model.save(os.path.join(save_path, 'final_model.h5'))
    print(f"Training complete. Final model saved to {save_path}/final_model.h5")
    return history

if __name__ == '__main__':
    
    # 1. Load and parse Configuration
    cfg = TrainingConfig()
    cfg = parse_args(cfg) 
    
    # 2. Environment and Strategy Setup
    strategy = configure_environment(cfg)
    
    # 3. Data Preparation
    train_generator, validation_generator, num_classes = load_data(cfg)
    
    # 4. Model Definition (Within Strategy Scope if multi-GPU is active)
    # Essential to define the model within the strategy scope for distributed training setup.
    with strategy.scope():
        input_shape = (*cfg.IMG_SIZE, 3)
        model = define_model(input_shape, num_classes, cfg.LEARNING_RATE, cfg.DROPOUT_RATE)
        model.summary()
        
    # 5. Training
    train_model(model, train_generator, validation_generator, cfg, strategy)