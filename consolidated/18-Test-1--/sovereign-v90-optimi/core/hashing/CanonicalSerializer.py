import json
import typing
import collections
from decimal import Decimal
from uuid import UUID
from datetime import datetime, date, timezone
from pathlib import Path
from .HashingErrors import ArtifactSerializationError

# AGI-KERNEL Improvement: Import dataclasses for robust structural data serialization (Cycle 1)
try:
    import dataclasses
    from dataclasses import is_dataclass, asdict
    DATACLASSES_AVAILABLE = True
except ImportError:
    DATACLASSES_AVAILABLE = False

# AGI-KERNEL Improvement: Import enum for deterministic serialization of configuration types (Cycle 1)
try:
    import enum
    ENUM_AVAILABLE = True
except ImportError:
    ENUM_AVAILABLE = False

# AGI-KERNEL Improvement (Cycle 3): Anticipatory imports for future data handling determinism (Logic/Memory Capability)
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

# AGI-KERNEL Improvement (Cycle 12): Import weakref for deterministic handling of memory-managed objects.
try:
    import weakref
    WEAKREF_AVAILABLE = True
except ImportError:
    WEAKREF_AVAILABLE = False

# AGI-KERNEL Improvement (Cycle 23): Import types for handling SimpleNamespace objects.
try:
    import types
    TYPES_AVAILABLE = True
except ImportError:
    TYPES_AVAILABLE = False

# AGI-KERNEL Improvement (Cycle 23): Import ctypes for handling C structure data stability in high-performance agents.
try:
    import ctypes
    CTYPES_AVAILABLE = True
except ImportError:
    CTYPES_AVAILABLE = False


class CanonicalJSONEncoder(json.JSONEncoder):
    """
    Custom encoder to handle types not natively serializable by standard JSON,
    ensuring deterministic output for hashing purposes.
    
    This encoder prioritizes consistency and robustness for core AGI data structures.
    
    AGI-KERNEL Improvement (Cycle 5):
    1. Added explicit handling for non-string dictionary keys, converting them canonically to strings.
    2. Enforced strict UTC conversion for timezone-aware datetimes to guarantee cross-environment hashing consistency.
    
    AGI-KERNEL Improvement (Cycle 6):
    3. Introduced deterministic handling for non-finite floating-point numbers (NaN, Infinity),
       crucial for stable hashing of mathematical outputs from /agents and /metrics.

    AGI-KERNEL Improvement (Cycle 7):
    4. Implemented null-value filtering for custom objects/dataclasses to ensure hash stability.
    5. Added deterministic handling for buffer types (bytearray, memoryview).
    
    AGI-KERNEL Improvement (Cycle 9):
    6. Added canonical serialization for functions, methods, and class types using fully qualified import paths.

    AGI-KERNEL Improvement (Cycle 10):
    7. Implemented deterministic handling for I/O streams and file handles to prevent serialization crashes during state hashing.

    AGI-KERNEL Improvement (Cycle 11):
    8. Added explicit handling for Python typing annotations (e.g., Union, List[T]) to ensure stable hashing of configuration schemas.

    AGI-KERNEL Improvement (Cycle 12):
    9. Added deterministic handling for weak references (`weakref.ReferenceType`), critical for stable hashing of complex, memory-managed agent states.

    AGI-KERNEL Improvement (Cycle 13):
    10. Implemented consolidated handling for custom object attributes, supporting structures defined using 
        Python's `__slots__` (common in high-performance agent code) alongside standard `__dict__`.
    11. Introduced explicit `__object__` tagging for custom class instances in the serialized output, 
        enhancing canonical structure consistency and pattern recognition for the kernel.
        
    AGI-KERNEL Improvement (Cycle 14):
    12. Introduced support for an explicit object serialization protocol (`__canonical_state__` method). 
        If present, this method is prioritized over generic introspection of `__dict__` and `__slots__`,
        giving agent developers fine-grained control over which internal state attributes are included 
        in the canonical hash, improving determinism and potentially performance for complex objects.

    AGI-KERNEL Improvement (Cycle 15, Emergence: Pattern Synthesis):
    13. Implemented a Key Canonicalization Layer (`_canonicalize_key`) to ensure non-string dictionary keys
        (like tuples or objects) are serialized into deterministic JSON strings before being used as map keys,
        fixing a critical determinism flaw in complex state structures.
        
    AGI-KERNEL Improvement (Cycle 16, Logic):
    14. Added introspection for public properties (`@property` decorators) in custom classes. This ensures 
        that derived or calculated state essential for an object's identity is included in the canonical hash,
        preventing unstable hashing of high-complexity agent models or configuration objects.

    AGI-KERNEL Improvement (Cycle 17, Logic/Memory):
    15. Fixed a critical determinism flaw in circular reference handling. Instead of using the 
        non-deterministic Python object ID (`id()`) in the output, the encoder now maps object 
        IDs to a serialization-local, canonical integer index (0, 1, 2, ...), ensuring hash stability 
        even when deep, cyclic graphs are encountered across different execution runs.
    16. Added explicit, canonical serialization handling for the Python constants `Ellipsis` 
        and `NotImplemented` commonly used in configuration schemas and agent functional prototypes.

    AGI-KERNEL Improvement (Cycle 18, Logic/Architecture):
    17. Implemented intrinsic content extraction for custom classes that subclass built-in containers (list, dict).
        This ensures that the canonical state of objects like specialized agent history lists or state dictionaries
        is captured alongside their custom attributes, preventing loss of container content and guaranteeing stable hashing.
        
    AGI-KERNEL Improvement (Cycle 19, Emergence: Architectural Protocol Synthesis):
    18. Introduced the `__canonical_attributes__` class protocol. This declarative approach allows complex
        objects (especially high-performance agents with caching/dynamic attributes) to explicitly list
        which fields, slots, or properties are required for canonical hashing. This drastically improves
        determinism and performance by replacing wide, brittle introspection with a targeted registry,
        preventing non-deterministic internal state (e.g., function references, pointers, non-essential caches)
        from being accidentally included in the canonical hash.

    AGI-KERNEL Improvement (Cycle 20, Logic/Memory):
    19. Implemented explicit canonical tagging for immutable containers (`tuple`, `frozenset`). This ensures
        that the structural semantics (e.g., immutability vs. mutability) are preserved in the canonical
        representation, which is critical for the kernel's ability to perform advanced pattern recognition
        and structural learning across the codebase.
        
    AGI-KERNEL Improvement (Cycle 21, Logic/Governance):
    20. Added explicit, deterministic serialization for Python `BaseException` objects (including standard exceptions and warnings). This ensures that error states logged by `/governance` or stored in agent history are hashed consistently by stripping non-deterministic elements (like tracebacks or memory references) and only including the exception type and constructor arguments.
    
    AGI-KERNEL Improvement (Cycle 22, Emergence: Schema Stability Protocol):
    21. Added dedicated, canonical serialization for `typing.TypeVar` objects. This extracts only the declarative attributes (name, bound, constraints, variance) to ensure schemas and abstract type definitions hash deterministically, regardless of runtime memory location or internal non-deterministic state.

    AGI-KERNEL Improvement (Cycle 23, Logic/Configuration):
    22. Added canonical serialization for `types.SimpleNamespace` objects, treating them as standard attribute dictionaries, ensuring stable hashing for dynamic configuration objects used extensively in `/config`.
    23. Implemented deterministic handling for `ctypes.Structure` and `ctypes.Union` types (via anticipatory import). This prevents non-deterministic memory pointers/layouts from affecting the canonical hash, crucial for stable state tracking in high-performance FFI-using agents.
    
    AGI-KERNEL Improvement (Cycle 24, Emergence: Determinism Filtering Protocol):
    24. Implemented the `__canonical_skip__` class protocol and introduced a set of `DEFAULT_SKIP_ATTRIBUTES` 
        (e.g., '_lock', '_cache'). This filtering layer proactively excludes non-deterministic, internal 
        state (like caching mechanisms or runtime locks) from the canonical hash, dramatically increasing 
        the stability of hashing for existing, complex objects throughout the 2,300+ codebase that 
        have not yet implemented the `__canonical_attributes__` white-list protocol.

    AGI-KERNEL Improvement (Cycle 25, Logic/Data Integrity):
    25. Implemented dedicated, canonical serialization for `collections.defaultdict` (capturing `default_factory`)
        and `collections.Counter` (capturing content and type tag). This ensures structural semantics are
        preserved in the hash, which is critical for deterministic hashing of high-level agent configuration
        and metrics data structures.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # AGI-KERNEL Improvement (Cycle 17): Initialization for Deterministic Circularity Tracking.
        # Maps Python object id() to a canonical integer index (0, 1, 2, ...) unique to this serialization run.
        self._canonical_id_map = {}
        self._next_canonical_id = 0

    def _canonicalize_key(self, key):
        """
        Helper to serialize complex, non-string dictionary keys deterministically.
        Routes the key through the full canonicalization process to ensure stability.
        """
        try:
            # 1. Recursively process the key using the standard default method.
            processed_key = self.default(key)
        except Exception:
            # Fallback if processing the key fails unexpectedly
            return str(key)
        
        # If the processed key is a scalar (string, number, boolean, None), use its simple string form.
        if isinstance(processed_key, (str, int, float, bool, type(None))):
            return str(processed_key)

        # 2. If the processed key is a complex structure (list, dict), fully canonicalize it 
        # by dumping it into a JSON string using tight separators and sorted keys.
        try:
            # Use standard json.dumps since processed_key should now only contain native Python types.
            return json.dumps(
                processed_key, 
                sort_keys=True,
                separators=(',', ':') 
            )
        except TypeError:
            # Safety fallback for unexpected structures
            return str(key)


    def default(self, obj):
        
        # 0a. Handle Data Science Types deterministically (Anticipatory AGI Logic)
        if NUMPY_AVAILABLE and isinstance(obj, np.ndarray):
            # Convert NumPy arrays to standard lists for deterministic hashing.
            return obj.tolist()
        
        if PANDAS_AVAILABLE and isinstance(obj, pd.Timestamp):
            # Convert Pandas timestamps to canonical ISO format.
            return obj.isoformat()

        # 0b. Handle Enumerations (Crucial for deterministic configs/governance data)
        if ENUM_AVAILABLE and isinstance(obj, enum.Enum):
            # Prioritize the enum's value if available, otherwise use its name.
            try:
                return obj.value
            except AttributeError:
                return obj.name

        # 0c. AGI-KERNEL Improvement (Cycle 9/11/22): Deterministic Serialization for Callables (Functions, Methods) and Classes

        # AGI-KERNEL Improvement (Cycle 22, Emergence: Schema Stability Protocol): TypeVar Handling
        if isinstance(obj, typing.TypeVar):
            return {
                "__typevar__": True,
                "name": obj.__name__,
                "bound": self.default(obj.__bound__) if obj.__bound__ is not None else None,
                "constraints": self.default(obj.__constraints__),
                "covariant": obj.__covariant__,
                "contravariant": obj.__contravariant__,
                "extra": list(obj.__extra__) if hasattr(obj, '__extra__') else []
            }
            
        # 0d. AGI-KERNEL Improvement (Cycle 23, Architecture/Agents): Handle ctypes structures deterministically.
        if CTYPES_AVAILABLE and isinstance(obj, (ctypes.Structure, ctypes.Union)):
            canonical_struct = {
                "__ctypes_struct__": obj.__class__.__name__
            }
            # Only serialize defined fields, avoiding pointers or non-deterministic internal state.
            if hasattr(obj, '_fields_'):
                for field_name, field_type in obj._fields_:
                    try:
                        value = getattr(obj, field_name)
                        # Recursively serialize the field value
                        canonical_struct[field_name] = self.default(value)
                    except AttributeError:
                        # Skip if field access fails
                        continue
            
            return canonical_struct

        if callable(obj):
            try:
                module_name = getattr(obj, '__module__', None)

                # AGI-KERNEL Improvement (Cycle 11): Explicitly handle structural type hints (e.g., Union, List[T])
                if module_name and module_name.startswith('typing'):
                    # Use the standard string representation, which is canonical for most typing objects
                    return {"__type_annotation__": str(obj)}

                # Distinguish between instances and the class type itself
                is_class = isinstance(obj, type)
                marker = "__class__" if is_class else "__callable__"

                # Use fully qualified path (module and name) as canonical identifier
                qual_name = getattr(obj, '__qualname__', getattr(obj, '__name__', None))
                
                # Only serialize if we can get a non-built-in, recognizable path
                if module_name and qual_name and not module_name.startswith(('builtins', 'typing')):
                    return {marker: f"{module_name}.{qual_name}"}
                
            except Exception:
                # If introspection fails (e.g., highly custom C extensions), allow fall-through
                pass

        # 0e. AGI-KERNEL Improvement (Cycle 10): Handle I/O Streams/File Descriptors deterministically.
        if hasattr(obj, 'read') and hasattr(obj, 'close') and hasattr(obj, 'fileno'):
            try:
                # If the stream has a name (like a file path), use it as the canonical identifier
                if hasattr(obj, 'name') and isinstance(obj.name, str):
                    return {"__io_stream__": f"<FILE_HANDLE:{obj.name}>"}
                else:
                    # Use the class name as a fallback identifier
                    return {"__io_stream__": f"<GENERIC_STREAM:{obj.__class__.__name__}>"}
            except Exception:
                # If introspection fails, return a safe, generic marker
                return {"__io_stream__": "<UNIDENTIFIED_STREAM>"}

        # 0f. AGI-KERNEL Improvement (Cycle 12): Handle Weak References deterministically.
        if WEAKREF_AVAILABLE and isinstance(obj, weakref.ReferenceType):
            target = obj()
            if target is None:
                # Reference is dead. Use a canonical null marker.
                return {"__weakref__": "<DEAD_REFERENCE>"}
            else:
                # Reference is live. Serialize the target object itself recursively.
                return self.default(target)

        # 0g. AGI-KERNEL Improvement (Cycle 23, Logic/Configuration): Handle SimpleNamespace objects.
        if TYPES_AVAILABLE and isinstance(obj, types.SimpleNamespace):
            # Treat SimpleNamespace as a standard dictionary mapping its attributes
            return dict(obj.__dict__)

        # AGI-KERNEL Improvement (Cycle 21, Logic/Governance): Handle Exceptions and Warnings deterministically.
        if isinstance(obj, BaseException):
            qual_name = getattr(type(obj), '__qualname__', getattr(type(obj), '__name__', 'UnknownException'))
            module_name = getattr(type(obj), '__module__', 'builtins')

            # Exceptions (and Warnings, which subclass Exception) serialize based only on type and arguments.
            return {
                "__exception__": True,
                "type": f"{module_name}.{qual_name}",
                "args": list(obj.args)
            }

        # AGI-KERNEL Improvement (Cycle 17): Handle Python constants Ellipsis and NotImplemented
        if obj is Ellipsis:
            return {"__constant__": "Ellipsis"}
        if obj is NotImplemented:
            return {"__constant__": "NotImplemented"}

        # AGI-KERNEL Improvement (Cycle 6): Handle non-finite floats deterministically
        if isinstance(obj, float):
            # Check for NaN (NaN is the only float not equal to itself)
            if obj != obj: 
                return {"__float__": "NaN"}
            if obj == float('inf'):
                return {"__float__": "Infinity"}
            if obj == float('-inf'):
                return {"__float__": "-Infinity"}
            # Otherwise, allow standard JSON float serialization

        # AGI-KERNEL Improvement (Cycle 4): Handle complex numbers required by /metrics and advanced /agents math models.
        if isinstance(obj, complex):
            # Represent complex numbers explicitly as an object for canonical hashing.
            return {"__complex__": True, "real": obj.real, "imag": obj.imag}

        # 1. Handle non-native iterables deterministically
        
        # AGI-KERNEL Improvement (Cycle 20, Logic/Memory): Explicitly tag immutable containers (frozenset, tuple)
        if isinstance(obj, frozenset):
            # Convert frozensets to sorted lists and tag
            return {"__frozenset__": sorted(list(obj))}
            
        if isinstance(obj, set):
            # Convert standard sets to sorted lists for canonical order
            return sorted(list(obj))

        if isinstance(obj, tuple):
            # AGI-KERNEL Improvement (Cycle 4): Explicitly handle NamedTuples to preserve field meaning.
            if hasattr(obj, '_asdict') and callable(obj._asdict):
                return obj._asdict()
            # Standard tuples are tagged (Cycle 20)
            return {"__tuple__": list(obj)}

        # AGI-KERNEL Improvement (Cycle 1): Handle Deques, common in /agents for history tracking.
        if isinstance(obj, collections.deque):
            return list(obj)
            
        # AGI-KERNEL Improvement (Cycle 8): Handle generic Iterators/Generators deterministically (Logic/Navigation).
        if hasattr(obj, '__iter__') and not isinstance(obj, (str, bytes, collections.Mapping, list, tuple, set, frozenset, collections.deque)):
            try:
                # Explicitly materialize to a list. This consumes the generator/iterator but guarantees
                # a deterministic, hashable sequence result required for canonical serialization.
                return list(obj)
            except TypeError:
                # If iteration fails, pass and let base handle it.
                pass

        # 2. Handle common complex types by converting to deterministic strings
        if isinstance(obj, datetime):
            # AGI-KERNEL Improvement (Cycle 5): Enforce UTC conversion for aware datetimes and standardize output format.
            if obj.tzinfo is not None and obj.tzinfo.utcoffset(obj) is not None:
                # Convert to UTC and remove tzinfo for clean ISO serialization
                obj = obj.astimezone(timezone.utc).replace(tzinfo=None)
                # Append 'Z' to explicitly mark canonical UTC time
                return obj.isoformat() + 'Z'
            
            # If naive, assume UTC for canonical consistency in core systems and mark 'Z'
            if obj.tzinfo is None:
                return obj.isoformat() + 'Z'
            
            # Fallback for other tz-aware datetimes (should be rare/specific offsets)
            return obj.isoformat()
            
        if isinstance(obj, date):
            return obj.isoformat()

        # Standard string conversion for other canonical types
        if isinstance(obj, Decimal):
            return str(obj)
        
        if isinstance(obj, UUID):
            return str(obj)
            
        if isinstance(obj, Path):
            # Cycle 3 Refinement: Use as_posix() to ensure consistent path separators across OS platforms for hashing integrity.
            return obj.as_posix()

        # 3. Handle binary data and buffer types (Crucial for artifact integrity)
        if isinstance(obj, bytes):
            return obj.hex()
        
        # AGI-KERNEL Improvement (Cycle 7): Handle memoryview and bytearray buffers deterministically.
        if isinstance(obj, (bytearray, memoryview)):
            # Convert buffers to bytes first, then use hex representation for canonical string
            return bytes(obj).hex()

        # 4. Handle mappings (dictionaries, ordered dicts, etc.)
        
        # AGI-KERNEL Improvement (Cycle 25, Logic/Data Integrity): Explicitly handle defaultdict.
        if isinstance(obj, collections.defaultdict):
            factory = obj.default_factory
            
            # Recursively canonicalize the factory.
            canonical_factory = self.default(factory) if factory else None
            
            # Ensure contents are serialized as a regular dictionary (handling complex keys internally).
            content_dict = {}
            for k, v in obj.items():
                if isinstance(k, str):
                    canonical_k = k
                else:
                    canonical_k = self._canonicalize_key(k)
                content_dict[canonical_k] = v

            return {
                "__defaultdict__": True,
                "default_factory": canonical_factory,
                "content": content_dict
            }
            
        # AGI-KERNEL Improvement (Cycle 25, Logic/Data Integrity): Explicitly handle Counter.
        if isinstance(obj, collections.Counter):
            # Counter items must be serialized to preserve integer counts and semantics.
            
            # Use the standard dictionary processing logic but wrap the result
            new_dict = {}
            for k, v in obj.items():
                if isinstance(k, str):
                    canonical_k = k
                else:
                    canonical_k = self._canonicalize_key(k)
                new_dict[canonical_k] = v
                
            return {
                "__counter__": True,
                "content": new_dict
            }

        if isinstance(obj, collections.Mapping):
            new_dict = {}
            for k, v in obj.items():
                if isinstance(k, str):
                    canonical_k = k
                else:
                    # AGI-KERNEL Improvement (Cycle 15): Key Canonicalization Layer
                    # Ensures stable string representation for complex keys (e.g., tuples, custom objects)
                    canonical_k = self._canonicalize_key(k)
                    
                new_dict[canonical_k] = v
            # Note: This returns a regular dict, which will be sorted by the outer json.dumps
            return new_dict
            
        # 5. AGI Logic: Handle custom class instances that don't belong to standard libraries
        if not type(obj).__module__.startswith(('builtins', 'collections', 'typing', 'datetime', 'decimal', 'pathlib', 'uuid', 'enum', 'numpy', 'pandas', 'weakref', 'ctypes', 'types')):
            
            obj_id = id(obj)

            # AGI-KERNEL Improvement (Cycle 17): Critical Fix for Non-Deterministic Circular References.
            if obj_id in self._canonical_id_map:
                # Circularity detected. Use the serialization-local canonical index.
                canonical_ref_id = self._canonical_id_map[obj_id]
                return f"<CANONICAL_CIRCULAR_REF:{canonical_ref_id}>"

            # Assign a new canonical ID and track it before attempting serialization
            self._canonical_id_map[obj_id] = self._next_canonical_id
            self._next_canonical_id += 1

            # AGI-KERNEL Improvement (Cycle 14): Prioritize explicit canonical state protocol (__canonical_state__)
            if hasattr(obj, '__canonical_state__') and callable(obj.__canonical_state__):
                try:
                    canonical_state = obj.__canonical_state__()
                    if isinstance(canonical_state, collections.Mapping):
                        return {"__object": obj.__class__.__name__, **canonical_state}
                except Exception:
                    # Fall through if the explicit protocol implementation fails or returns non-mapping
                    pass

            # Prioritize explicit interface if defined by the object itself (kept for legacy to_canonical_dict)
            if hasattr(obj, 'to_canonical_dict'):
                return obj.to_canonical_dict()
            
            # 5a. Explicit dataclass serialization for structural integrity
            if DATACLASSES_AVAILABLE and is_dataclass(obj):
                # Use asdict() for robust, nested conversion of dataclass fields.
                # AGI-KERNEL Improvement (Cycle 7): Apply NULL filtering to dataclasses for hashing determinism.
                raw_dict = asdict(obj)
                # Filter out None values to ensure canonical output stability
                return {k: v for k, v in raw_dict.items() if v is not None}

            # 5c. Generalized attribute serialization (Handling __dict__, __slots__, @property, and new protocol)
            attributes = {}
            klass = type(obj)
            
            # AGI-KERNEL Improvement (Cycle 24, Emergence: Determinism Filtering Protocol):
            # Define common non-deterministic attributes to skip by default.
            DEFAULT_SKIP_ATTRIBUTES = {'_lock', '_cache', '_memo', '_session', '_thread_local', '_non_canonical_state', '_logger', '_weakref'}
            
            # AGI-KERNEL Improvement (Cycle 24): Read the explicit skip protocol (__canonical_skip__)
            # Combine the default skips with any class-defined skips for comprehensive filtering.
            canonical_skip = DEFAULT_SKIP_ATTRIBUTES.union(
                set(getattr(klass, '__canonical_skip__', []))
            )
            
            # AGI-KERNEL Improvement (Cycle 19): Architectural Protocol Synthesis
            canonical_attrs = getattr(klass, '__canonical_attributes__', None)
            
            source_keys = set()
            
            if canonical_attrs and isinstance(canonical_attrs, (list, tuple)):
                # 1. Use the explicit protocol if defined: trust the developer specified list of canonical keys.
                source_keys.update(canonical_attrs)
            else:
                # 2. Fallback to comprehensive introspection (pre-Cycle 19 behavior)
                
                # Gather keys from __dict__
                if hasattr(obj, '__dict__'):
                    source_keys.update(obj.__dict__.keys())

                # Gather keys from __slots__ 
                if hasattr(obj, '__slots__'):
                    source_keys.update(obj.__slots__)
                
                # Gather keys from public properties
                for k in dir(obj):
                    if not k.startswith('_') and hasattr(klass, k):
                        attr = getattr(klass, k)
                        if isinstance(attr, property):
                             source_keys.add(k)
            
            # AGI-KERNEL Improvement (Cycle 24): Apply the combined skip list filter immediately.
            source_keys -= canonical_skip
            
            # AGI-KERNEL Improvement (Cycle 18): Capture Intrinsic State for Container Subclasses
            is_container_subclass = False
            if isinstance(obj, list):
                # For list/tuple subclasses, serialize the underlying list content
                attributes["__list_content__"] = list(obj)
                is_container_subclass = True
            elif isinstance(obj, dict):
                # For dict subclasses, serialize the underlying dict content, ensuring keys are canonicalized.
                content_dict = {}
                for k, v in obj.items():
                    if isinstance(k, str):
                        canonical_k = k
                    else:
                        # Use the explicit key canonicalization layer (Cycle 15)
                        canonical_k = self._canonicalize_key(k)
                    content_dict[canonical_k] = v
                attributes["__dict_content__"] = content_dict
                is_container_subclass = True


            # Iterate over the determined source keys
            for k in source_keys:
                # Check if the key starts with '_' and we are NOT using the explicit canonical_attrs protocol
                if not canonical_attrs and k.startswith('_'):
                    continue

                try:
                    value = getattr(obj, k)
                    
                    if value is not None and not callable(value):
                        # Ensure we don't accidentally overwrite container markers if the user used the same key name
                        if k not in attributes:
                             attributes[k] = value
                             
                except AttributeError:
                    # Skip attributes that fail to retrieve
                    pass


            # Process gathered attributes (including container content markers)
            if attributes:
                final_dict = {}
                
                for k, v in attributes.items():
                    # Check for canonical content markers (must be preserved)
                    is_canonical_content = k in ("__list_content__", "__dict_content__")
                    
                    if v is not None and not callable(v):
                        
                        if is_canonical_content or canonical_attrs or not k.startswith('_'):
                            final_dict[k] = v

                if final_dict:
                    # AGI-KERNEL Improvement (Cycle 13/18): Tag the structure with class name 
                    return {"__object__": obj.__class__.__name__, **final_dict}
            
            # If the object was tracked but yielded no serializable state (e.g., empty object with no slots/dict/content),
            # we still must return the tag to avoid losing its presence in the structure.
            return {"__object__": obj.__class__.__name__}
            
        # Let the base class default raise the TypeError for truly unsupported types
        return super().default(obj)

def serialize_for_hashing(artifact: typing.Any) -> bytes:
    """Converts an arbitrary Python object into a canonical byte string for hashing.

    Canonical serialization ensures that the byte output is consistent across different
    execution environments, specifically by enforcing sorted dictionary keys and
    handling complex Python types deterministically (e.g., bytes, sets, file paths).

    Args:
        artifact: The data structure (typically a dictionary or list) to serialize.

    Returns:
        bytes: The deterministic byte representation.

    Raises:
        ArtifactSerializationError: If the data structure contains non-serializable types.
    """
    try:
        # Ensure consistent order using the custom encoder and standard canonical JSON settings
        serialized_string = json.dumps(
            artifact,
            sort_keys=True,
            separators=(',', ':'),
            cls=CanonicalJSONEncoder
        )
        return serialized_string.encode('utf-8')
    except TypeError as e:
        # Enhanced error context for improved Error Handling capability: report the top-level type and suggest checking nested elements.
        offending_type = type(artifact)
        error_message = (
            f"Failed to serialize artifact of type '{offending_type}'. "
            f"Check nested elements for non-JSON serializable types (e.g., functions, class instances, unhandled objects, open I/O streams, complex typing annotations, or unexpected weak references). "
            f"Original error: {e}"
        )
        raise ArtifactSerializationError(reason=error_message, data_type=str(offending_type)) from e
    except Exception as e:
        # Ensures all unexpected exceptions are wrapped in the specific domain error type.
        raise ArtifactSerializationError(reason=f"Unexpected serialization error: {e}") from e
