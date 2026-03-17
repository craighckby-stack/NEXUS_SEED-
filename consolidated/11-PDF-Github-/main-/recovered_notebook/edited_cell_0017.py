import random
import string

# Configuration
k_iterations = 1000
k_chars_per_iter = 10
total_length = k_iterations * k_chars_per_iter

# Efficient generation of the large random string in a single step
random_string = ''.join(
    random.choices(string.ascii_letters, k=total_length)
)

# If printing the final result is required, do it once.
# print(random_string)
