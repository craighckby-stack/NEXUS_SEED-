import functools

class CGRRegistrar:
    def __init__(self):
        self.registry = {}
    
    @functools.singledispatch
    def register(self, item):
        raise TypeError(f"Cannot register item of type {type(item)}")
    
    @register.register
    def _(self, item: str):
        self.registry[item] = item
    
    @register.register
    def _(self, item: int):
        self.registry[item] = item
    
    def get(self, item):
        return self.registry.get(item)
