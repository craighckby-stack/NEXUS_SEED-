import numpy as np
from sklearn.decomposition import PCA, KernelPCA, FastICA
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from typing import Optional, Union

class DimensionReducer:
    """Generalized class for dimensionality reduction using PCA, KPCA, or ICA."""
    def __init__(self, n_components: Union[int, float] = 2, method: str = 'PCA', random_state: int = 42):
        self.n_components = n_components
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.method = method.upper()
        self.reducer = self._initialize_reducer()
        self.explained_variance_ratio: Optional[np.ndarray] = None

    def _initialize_reducer(self):
        if self.method == 'PCA':
            return PCA(n_components=self.n_components, random_state=self.random_state)
        
        elif self.method == 'KPCA':
            # Kernel PCA implementation
            return KernelPCA(n_components=self.n_components, kernel="rbf", random_state=self.random_state, n_jobs=-1)
            
        elif self.method == 'ICA':
            # Independent Component Analysis
            if isinstance(self.n_components, float):
                 raise ValueError("ICA requires n_components to be an integer.")
            return FastICA(n_components=int(self.n_components), random_state=self.random_state, max_iter=1000)
        
        else:
            raise ValueError(f"Unknown reduction method: {self.method}. Choose from PCA, KPCA, ICA.")


    def fit(self, data: np.ndarray):
        """Fit the scaler and the dimension reduction model to the data."""
        scaled_data = self.scaler.fit_transform(data)
        self.reducer.fit(scaled_data)

        # Store variance only if using PCA
        if self.method == 'PCA' and hasattr(self.reducer, 'explained_variance_ratio_'):
            self.explained_variance_ratio = self.reducer.explained_variance_ratio_
        return self

    def transform(self, data: np.ndarray) -> np.ndarray:
        """Apply the trained scaler and dimension reduction model."""
        scaled_data = self.scaler.transform(data)
        reduced_data = self.reducer.transform(scaled_data)
        return reduced_data

    def fit_transform(self, data: np.ndarray) -> np.ndarray:
        """Fit and transform the data in one step."""
        self.fit(data)
        return self.transform(data)

    def plot_reduced_data(self, data: np.ndarray, targets: Optional[np.ndarray] = None, title: Optional[str] = None) -> None:
        """Plot the reduced data (best visualization when n_components=2)."""
        if data.shape[1] < 2:
            print("Warning: Cannot plot 2D data. Need at least 2 components.")
            return
        
        if data.shape[1] > 2:
             print(f"Warning: Displaying first two components only from {data.shape[1]} dimensions.")

        plt.figure(figsize=(10, 8))

        if targets is not None:
            # Color points by target/label
            scatter = plt.scatter(data[:, 0], data[:, 1], c=targets, cmap='viridis', alpha=0.7)
            plt.legend(*scatter.legend_elements(), title="Classes")
        else:
            plt.scatter(data[:, 0], data[:, 1])

        if title is None:
            title = f'{self.method} Reduced Data'

        plt.title(title)
        plt.xlabel(f'{self.method} Component 1')
        plt.ylabel(f'{self.method} Component 2')
        plt.grid(True, linestyle='--', alpha=0.6)
        plt.show()

    def plot_explained_variance(self) -> None:
        """Plots the cumulative and individual explained variance ratio (PCA only)."""
        if self.method != 'PCA' or self.explained_variance_ratio is None:
            print(f"Explained variance plot only available for fitted PCA.")
            return

        cumulative_variance = np.cumsum(self.explained_variance_ratio)
        n_components = len(self.explained_variance_ratio)
        x_ticks = np.arange(1, n_components + 1)

        fig, ax1 = plt.subplots(figsize=(10, 6))

        # Bar chart for individual variance
        color = 'tab:blue'
        ax1.set_xlabel('Principal Component Index')
        ax1.set_ylabel('Individual Explained Variance Ratio', color=color)
        ax1.bar(x_ticks, self.explained_variance_ratio, color=color, alpha=0.6, label='Individual Variance')
        ax1.tick_params(axis='y', labelcolor=color)

        # Line plot for cumulative variance
        ax2 = ax1.twinx()  # instantiate a second axes that shares the same x-axis
        color = 'tab:red'
        ax2.set_ylabel('Cumulative Explained Variance Ratio', color=color)
        ax2.plot(x_ticks, cumulative_variance, color=color, marker='o', label='Cumulative Variance')
        ax2.tick_params(axis='y', labelcolor=color)
        ax2.set_ylim(0, 1.05)

        plt.title('PCA Explained Variance Analysis')
        plt.xticks(x_ticks)
        plt.show()


# Example usage
if __name__ == '__main__':
    # Generate sample data with targets
    np.random.seed(0)
    data = np.random.rand(100, 15) * 5
    targets = np.random.randint(0, 4, 100) 

    print("--- Running PCA Example ---")
    # 1. Fit and transform (e.g., using a large n_components to inspect variance)
    pca_reducer = DimensionReducer(n_components=5, method='PCA')
    reduced_data_pca = pca_reducer.fit_transform(data)
    
    print(f"Reduced shape: {reduced_data_pca.shape}")

    # 2. Analysis
    pca_reducer.plot_explained_variance()
    
    # 3. Plotting the first two components
    pca_reducer.plot_reduced_data(reduced_data_pca, targets=targets, title="PCA Projection (Colored by Target)")
    
    print("\n--- Running ICA Example ---")
    # 4. Independent Component Analysis
    ica_reducer = DimensionReducer(n_components=2, method='ICA')
    reduced_data_ica = ica_reducer.fit_transform(data)
    
    ica_reducer.plot_reduced_data(reduced_data_ica, targets=targets, title="ICA Projection")