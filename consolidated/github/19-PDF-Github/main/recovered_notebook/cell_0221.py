import random
import numpy as np
import logging
import uuid
import hashlib
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(module)s - %(message)s')

class CognitiveModel:
    """Represents the underlying ML structure, potentially configured by Candidate params."""
    def __init__(self, config):
        self.config = config
        hidden_size = config.get('hidden_size', 10)
        # Initialize weights based on configuration
        self.weights = np.random.rand(hidden_size, hidden_size)

    def predict(self, input_data):
        # Simple prediction function
        return np.dot(input_data, self.weights)

class Candidate:
    """Represents a configuration or genetic payload in the evolution process."""
    def __init__(self, generation, params=None):
        self.uuid = str(uuid.uuid4())
        self.generation = generation
        self.params = params if params is not None else {'learning_rate': 0.01, 'hidden_size': 10}
        self.fitness = -1.0
        # Generate a unique and traceable signature based on configuration (justifying hashlib)
        self.signature = self._calculate_signature()

    def _calculate_signature(self):
        # Ensure parameters are hashed consistently
        param_str = json.dumps(self.params, sort_keys=True).encode('utf-8')
        return hashlib.sha256(param_str).hexdigest()

    def mutate(self):
        new_params = self.params.copy()
        
        # Simple mutation logic: perturb learning rate
        if 'learning_rate' in new_params:
            perturbation = random.uniform(-0.001, 0.001)
            new_params['learning_rate'] += perturbation
            # Enforce boundary conditions
            new_params['learning_rate'] = max(1e-5, new_params['learning_rate'])

        return Candidate(self.generation + 1, new_params)

    def __repr__(self):
        return f"Candidate(UUID={self.uuid[:8]}, Gen={self.generation}, Fitness={self.fitness:.4f})"

class EvolutionEngine:
    def __init__(self, population_size, mutation_rate, initial_generation=0):
        self.population_size = population_size
        self.mutation_rate = mutation_rate
        self.generation_count = initial_generation
        # Initialize population with starting parameters
        self.population = [Candidate(self.generation_count) for _ in range(population_size)]

    def evaluate_fitness(self, candidate):
        # Hallucinated Fitness Function: rewards candidates whose learning rate 
        # is close to a hypothetical optimal value (e.g., 0.008)
        lr = candidate.params.get('learning_rate', 0.01)
        target_lr = 0.008
        
        # Inverse proportional fitness to distance from target
        fitness = 1.0 / (1.0 + abs(target_lr - lr) * 1000)
        candidate.fitness = fitness
        return fitness

    def select(self):
        # Roulette wheel selection based on calculated fitness
        total_fitness = sum(c.fitness for c in self.population)
        
        if total_fitness == 0:
             # Safety net if all candidates have zero fitness
            return random.choice(self.population)

        selection_probabilities = [c.fitness / total_fitness for c in self.population]
        
        # Select one parent proportionally to fitness
        parent = random.choices(
            self.population,
            weights=selection_probabilities,
            k=1
        )[0]
        return parent

    def evolve(self):
        logging.info(f"Starting generation {self.generation_count}")
        
        # 1. Evaluation
        for candidate in self.population:
            self.evaluate_fitness(candidate)

        # 2. Selection and Reproduction
        new_population = []
        for _ in range(self.population_size):
            parent = self.select()
            
            if random.random() < self.mutation_rate:
                child = parent.mutate() # Generates Candidate with Gen + 1
            else:
                # Cloning (preserving parent's existing parameters and generation)
                child = Candidate(parent.generation, parent.params.copy())
            
            new_population.append(child)

        self.population = new_population
        self.generation_count += 1

    def test(self):
        if not self.population:
            return
            
        # Log summary of the fittest individual of the current generation
        best_candidate = max(self.population, key=lambda c: c.fitness)
        
        logging.info(f"--- Generation {self.generation_count} Summary ---")
        logging.info(f"Best Fitness: {best_candidate.fitness:.6f}")
        logging.info(f"Best Params: {best_candidate.params}")
        logging.debug(f"Best Signature: {best_candidate.signature}")

def main():
    population_size = 50
    mutation_rate = 0.3
    engine = EvolutionEngine(population_size, mutation_rate)

    for i in range(20):
        engine.evolve()
        engine.test()

if __name__ == "__main__":
    main()
