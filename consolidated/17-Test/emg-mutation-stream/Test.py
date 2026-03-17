import sys
import gc
import re
import ast
import logging
import time
import warnings
from dataclasses import dataclass, field
from typing import Dict, Any, Tuple, Optional, Callable, Type, ClassVar, List
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# --- 1. CORE EXCEPTIONS ---

class LLMBaseError(Exception):
    """Base exception for all errors in the LLM pipeline."""
    pass

class InitializationError(LLMBaseError):
    """Base exception for setup failures."""
    pass

class DependencyError(InitializationError):
    """Specific error for missing or failed-to-load dependencies."""
    pass

class ModelLoadingError(InitializationError):
    """Specific error for model loading, quantization, and OOM fallback failures."""
    pass

class LLMInferenceError(LLMBaseError):
    """Error specific to LLM inference or generation failure."""
    pass

# --- 2. STATIC CONFIGURATION AND UTILITIES ---

class StaticConstants:
    """Immutable, static configuration and compiled resources."""
    ONE_GB: float = 1024**3
    LOG_FORMAT: str = '%(asctime)s - %(levelname)s - %(module)s.%(funcName)s:%(lineno)d - %(message)s'
    REQUIRED_MODULES: ClassVar[Tuple[str, ...]] = ('torch', 'transformers', 'psutil')
    SYSTEM_MEMORY_RESERVE_GB: float = 1.5
    DEFAULT_WORKSPACE: Path = Path(".daf_workspace")
    MAX_LOAD_ATTEMPTS: int = 3
    
    # Robust Regex patterns for code extraction
    RE_MD_PYTHON: ClassVar[re.Pattern] = re.compile(
        r'(?:python|py)\s*\n(.*?)\n', re.DOTALL | re.IGNORECASE
    )
    RE_MD_GENERIC: ClassVar[re.Pattern] = re.compile(
        r'(?:[\w\s]*)\s*\n(.*?)\n', re.DOTALL | re.IGNORECASE
    )
    RE_STRIP_INTRO: ClassVar[re.Pattern] = re.compile(
        r'^(?:[\s\W]*|python|\s*|\w+\s*)*'  
        r'(?:Certainly|Here is the improved|The code is|python||\s*)*', 
        re.IGNORECASE | re.MULTILINE
    )

def memory_scrub(torch_lib: Optional[Any], psutil_lib: Optional[Any], has_gpu: bool) -> None:
    """Aggressively clear memory cache, crucial for OOM fallback scenarios."""
    logging.debug("🧹 Initiating deep memory scrub...")
    
    if torch_lib and has_gpu:
        try:
            torch_lib.cuda.empty_cache()
            torch_lib.cuda.synchronize()
            logging.debug("   CUDA cache cleared.")
        except Exception:
            pass
            
    gc.collect() 
    
    if psutil_lib and logging.root.level <= logging.DEBUG:
        try:
            mem = psutil_lib.virtual_memory()
            free_gb = mem.available / StaticConstants.ONE_GB 
            logging.debug(f"   Current Free RAM: {free_gb:.2f} GB") 
        except Exception:
            pass

# Globally suppress known warnings
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', message='The installed version of bitsandbytes') 

# --- 3. ENVIRONMENT DETECTION ---

@dataclass(frozen=True)
class RuntimeEnvironment:
    """Encapsulates environment state and dynamically loaded modules."""
    torch: Optional[Any] = field(default=None)
    psutil: Optional[Any] = field(default=None)
    transformers: Optional[Any] = field(default=None)
    
    HAS_TORCH: bool = field(init=False)
    HAS_PSUTIL: bool = field(init=False)
    HAS_TRANSFORMERS: bool = field(init=False)
    IS_INTERACTIVE: bool = field(init=False)
    HAS_GPU: bool = field(init=False)
    DEFAULT_DEVICE: str = field(init=False)
    DEFAULT_DTYPE: Optional[Type] = field(init=False)

    def __post_init__(self):
        # Helper function for setting frozen attributes
        def _set_frozen(name, value):
            object.__setattr__(self, name, value)

        _set_frozen('HAS_TORCH', self.torch is not None)
        _set_frozen('HAS_PSUTIL', self.psutil is not None)
        _set_frozen('HAS_TRANSFORMERS', self.transformers is not None)
        
        is_interactive = ('google.colab' in sys.modules or 
                          'ipykernel' in sys.modules or 
                          hasattr(sys, 'ps1'))
        _set_frozen('IS_INTERACTIVE', is_interactive)

        self._detect_hardware(_set_frozen)

    def _detect_hardware(self, setter: Callable[[str, Any], None]):
        """Determine GPU availability, default device, and optimized dtype."""
        has_gpu = False
        default_device = 'cpu'
        default_dtype = None

        if self.HAS_TORCH:
            try:
                if self.torch.cuda.is_available() and self.torch.cuda.device_count() > 0:
                    has_gpu = True
                    default_device = f'cuda:{self.torch.cuda.current_device()}'
                    
                    if self.torch.cuda.is_bf16_supported():
                        default_dtype = self.torch.bfloat16
                    else:
                        default_dtype = self.torch.float16
                else:
                    default_dtype = self.torch.float32 
            except Exception as e:
                logging.debug(f"Hardware detection failed: {e}")
                default_dtype = self.torch.float32

        setter('HAS_GPU', has_gpu)
        setter('DEFAULT_DEVICE', default_device)
        setter('DEFAULT_DTYPE', default_dtype)

class EnvironmentManager:
    """Manages the initialization and exposure of the global runtime environment."""
    
    def __init__(self):
        self._env = self._load_environment()
        
    @property
    def env(self) -> RuntimeEnvironment:
        return self._env

    def _load_environment(self) -> RuntimeEnvironment:
        """Dynamically load required dependencies."""
        modules: Dict[str, Optional[Any]] = {}
        
        for mod_name in StaticConstants.REQUIRED_MODULES:
            try:
                modules[mod_name] = __import__(mod_name)
            except ImportError:
                modules[mod_name] = None
            except Exception as e:
                logging.error(f"Error loading module {mod_name}: {e}")
                modules[mod_name] = None
                
        env_instance = RuntimeEnvironment(
            torch=modules.get('torch'),
            psutil=modules.get('psutil'),
            transformers=modules.get('transformers')
        )

        if not (env_instance.HAS_TORCH and env_instance.HAS_TRANSFORMERS):
            missing = [mod for mod, obj in modules.items() if obj is None and mod in ('torch', 'transformers')]
            if missing:
                 logging.critical(f"Missing core LLM dependencies: {', '.join(missing)}. Model operations will fail.")
        
        return env_instance

# --- 4. CONFIGURATION MANAGEMENT ---

@dataclass
class LLMConfig:
    """Dynamic configuration for the LLM pipeline."""
    
    # Static Model Definitions (Decoupled from runtime environment here, allows overriding)
    MODEL_OPTIONS: Dict[str, Dict] = field(default_factory=lambda: {
        "tiny": {"name": "microsoft/phi-2", "max_tokens": 512, "quantization": "4bit", "fallback": None, "approx_vram_gb": 2.0},
        "small": {"name": "deepseek-ai/deepseek-coder-1.3b-instruct", "max_tokens": 1024, "quantization": "4bit", "fallback": "tiny", "approx_vram_gb": 3.0},
        "medium": {"name": "deepseek-ai/deepseek-coder-6.7b-instruct", "max_tokens": 2048, "quantization": "4bit", "fallback": "small", "approx_vram_gb": 6.0},
        "large": {"name": "deepseek-ai/deepseek-coder-33b-instruct", "max_tokens": 4096, "quantization": "4bit", "fallback": "medium", "approx_vram_gb": 18.0}
    })

    # User-settable core parameters
    LOG_LEVEL: str = "INFO"
    MODEL_SIZE: str = "small"
    USE_GPU: bool = False # Will be set by ConfigManager based on Env
    MEMORY_RESERVE_GB: float = StaticConstants.SYSTEM_MEMORY_RESERVE_GB 
    WORKSPACE_ROOT: Path = field(default_factory=lambda: StaticConstants.DEFAULT_WORKSPACE)

    # Derived parameters (managed by ConfigManager)
    MEMORY_GB: float = field(init=False, default=4.0)
    MODEL_CACHE_DIR: Path = field(init=False)
    LOG_DIR: Path = field(init=False)
    DEVICE: str = field(init=False)
    DTYPE: Optional[Type] = field(init=False)


class ConfigManager:
    """Handles configuration initialization, logging, path setup, and resource checks."""
    
    def __init__(self, env: RuntimeEnvironment, **user_overrides: Any):
        self.config = LLMConfig()
        self.env = env
        
        # Initialize default USE_GPU based on environment
        self.config.USE_GPU = env.HAS_GPU

        # Apply user overrides before initialization
        for key, value in user_overrides.items():
            if hasattr(self.config, key):
                setattr(self.config, key, value)
            else:
                logging.warning(f"⚠️ Unknown config key provided: {key}. Ignoring.")

        self._initialize_pipeline()
        logging.info(f"⚙️ Config Final: Model={self.config.MODEL_SIZE}, Device={self.config.DEVICE}, RAM={self.config.MEMORY_GB:.1f}GB")

    def _initialize_pipeline(self) -> None:
        """Run all hardening checks and initializations in a defined order."""
        self._initialize_resources()
        self._set_device_and_dtype()
        self._initialize_paths()
        self._setup_logging()
        self._adjust_model_size_if_needed()

    def _initialize_resources(self) -> None:
        """Detect available system RAM."""
        if self.env.HAS_PSUTIL:
            try:
                self.config.MEMORY_GB = self.env.psutil.virtual_memory().total / StaticConstants.ONE_GB
            except Exception:
                pass 

    def _initialize_paths(self) -> None:
        """Initialize and create necessary paths robustly."""
        self.config.MODEL_CACHE_DIR = self.config.WORKSPACE_ROOT / "model_cache"
        self.config.LOG_DIR = self.config.WORKSPACE_ROOT / "logs"
        
        for directory in (self.config.WORKSPACE_ROOT, self.config.MODEL_CACHE_DIR, self.config.LOG_DIR):
            try:
                directory.mkdir(parents=True, exist_ok=True)
            except OSError as e:
                raise InitializationError(f"Directory setup failed: {directory}") from e

    def _setup_logging(self) -> None:
        """Setup logging configuration robustly and idempotently."""
        level = getattr(logging, self.config.LOG_LEVEL.upper(), logging.INFO)
        root_logger = logging.getLogger()
        root_logger.setLevel(level)
        
        # Remove existing stream handlers to prevent duplication if called multiple times
        root_logger.handlers = [h for h in root_logger.handlers if not isinstance(h, (logging.FileHandler, logging.StreamHandler))]
            
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_file = self.config.LOG_DIR / f"daf_{timestamp}.log"
        formatter = logging.Formatter(StaticConstants.LOG_FORMAT)
        
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
        
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(formatter)
        root_logger.addHandler(stream_handler)
        
        # Ensure all handlers are set to the target level
        for handler in root_logger.handlers:
            handler.setLevel(level)


    def _adjust_model_size_if_needed(self) -> None:
        """Auto-adjust model size down if insufficient RAM."""
        
        current_memory_gb = self.config.MEMORY_GB
        feasible_size = "tiny"
        sorted_sizes = sorted(self.config.MODEL_OPTIONS.keys(), key=lambda k: self.config.MODEL_OPTIONS[k]['approx_vram_gb'])

        for size in sorted_sizes:
            info = self.config.MODEL_OPTIONS[size]
            required_ram = info['approx_vram_gb'] + self.config.MEMORY_RESERVE_GB 
            
            if current_memory_gb >= required_ram:
                feasible_size = size
            else:
                break 

        original_size = self.config.MODEL_SIZE
        requested_vram = self.config.MODEL_OPTIONS.get(self.config.MODEL_SIZE, {}).get('approx_vram_gb', float('inf'))
        
        if requested_vram + self.config.MEMORY_RESERVE_GB > current_memory_gb:
             self.config.MODEL_SIZE = feasible_size
             if original_size != self.config.MODEL_SIZE:
                 logging.warning(
                     f"🔄 Auto-adjusted model size: {original_size} -> {self.config.MODEL_SIZE} "
                     f"due to insufficient system memory ({current_memory_gb:.1f}GB total)."
                 )

    def _set_device_and_dtype(self) -> None:
        """Finalize device and dtype settings based on requested GPU usage."""
        if not self.env.HAS_TORCH:
            self.config.DEVICE = 'cpu'
            self.config.DTYPE = None
            self.config.USE_GPU = False
            return

        if self.config.USE_GPU and self.env.HAS_GPU:
             self.config.DEVICE = self.env.DEFAULT_DEVICE
             self.config.DTYPE = self.env.DEFAULT_DTYPE
        else:
             self.config.DEVICE = 'cpu'
             self.config.DTYPE = self.env.torch.float32
             if self.config.USE_GPU and not self.env.HAS_GPU:
                 logging.warning("⚠️ USE_GPU requested but no CUDA device detected. Falling back to CPU.")
                 self.config.USE_GPU = False

# --- 5. ROBUST CODE EXTRACTOR ---

class RobustCodeExtractor:
    """6-Layer Extraction Strategy to handle messy LLM outputs, prioritized by reliability."""
    
    def __init__(self):
        self._strategies: Tuple[Callable[[str, str], Optional[str]], ...] = (
            self._strategy_markdown_python,
            self._strategy_generic_markdown,
            self._strategy_explicit_markers,
            self._strategy_after_prompt_heuristic,
            self._strategy_keyword_start,
            self._strategy_raw_cleanup
        )
    
    @staticmethod
    def _validate_syntax(code: str) -> bool:
        """Validate Python syntax using ast, with a structural heuristic."""
        try:
            code = code.strip()
            # Basic sanity check (must contain structural elements)
            if not any(kw in code for kw in ['def ', 'class ', 'import ', 'from ', 'async ']):
                 return False
            
            ast.parse(code)
            return True
        except (SyntaxError, ValueError, TypeError):
            return False
        except Exception:
            return False
    
    def extract(self, text: str, original_prompt: str = "") -> Optional[str]:
        """Execute all extraction strategies in priority order."""
        text = text.strip()
        if not text:
            return None
            
        for i, strategy in enumerate(self._strategies):
            try:
                candidate = strategy(text, original_prompt)
                
                if candidate: 
                    candidate = candidate.strip()
                    if self._validate_syntax(candidate):
                        logging.debug(f"✅ Extracted code via Strategy {i+1}: {strategy.__name__}")
                        return candidate
            except Exception:
                # Log debug error but continue to next strategy
                continue 
        
        logging.warning("❌ Code extraction failed to yield valid Python output after all strategies.")
        return None
    
    def _strategy_markdown_python(self, text: str, original_prompt: str = "") -> Optional[str]:
        """Strategy 1: Extract Python code from  ...  blocks."""
        matches = StaticConstants.RE_MD_PYTHON.findall(text)
        return matches[-1].strip() if matches else None
    
    def _strategy_generic_markdown(self, text: str, original_prompt: str = "") -> Optional[str]:
        """Strategy 2: Extract code from generic markdown blocks (...)."""
        if StaticConstants.RE_MD_PYTHON.search(text):
            return None 
            
        matches = StaticConstants.RE_MD_GENERIC.findall(text)
        return matches[-1].strip() if matches else None

    def _strategy_explicit_markers(self, text: str, original_prompt: str = "") -> Optional[str]:
        """Strategy 3: Extract code following explicit structural markers."""
        MARKERS = ('## IMPROVED CODE', '# Improved Code:', 'Improved Code:', 'RESULT:', 'FINAL CODE:')
        text_lower = text.lower()
        
        for start_marker in MARKERS:
            idx = text_lower.find(start_marker.lower())
            if idx >= 0:
                start_idx = idx + len(start_marker)
                code_part = text[start_idx:].strip()
                
                code = StaticConstants.RE_STRIP_INTRO.sub('', code_part).strip()
                
                STOP_PHRASES = ('\n\nI hope this helps', '\n\nLet me know', '\n\nConclusion', '')
                for phrase in STOP_PHRASES:
                    end_idx = code.find(phrase)
                    if end_idx != -1:
                        code = code[:end_idx].strip()

                if code: return code
        return None
    
    def _strategy_after_prompt_heuristic(self, text: str, original_prompt: str) -> Optional[str]:
        """Strategy 4: Remove boilerplate if the result immediately starts with Python structure."""
        cleaned_text = StaticConstants.RE_STRIP_INTRO.sub('', text, count=1).strip()
            
        if cleaned_text.startswith(('def ', 'class ', 'import ', 'from ', 'async def ')):
            return cleaned_text
        return None
    
    def _strategy_keyword_start(self, text: str, original_prompt: str = "") -> Optional[str]:
        """Strategy 5: Extract code by finding the earliest non-indented Python keyword/definition."""
        KEYWORDS = ('def ', 'class ', 'import ', 'from ', '@', 'async def ')
        best_idx = float('inf')
        
        for keyword in KEYWORDS:
            idx = text.find(keyword)
            if idx >= 0 and (idx == 0 or text[idx-1].isspace() or text[idx-1] == '\n'):
                if idx < best_idx:
                    best_idx = idx

        if best_idx != float('inf'):
            return text[best_idx:].strip()
            
        return None
    
    def _strategy_raw_cleanup(self, text: str, original_prompt: str = "") -> Optional[str]:
        """Strategy 6: Last resort: return the whole text after stripping introductions and conclusions."""
        cleaned = StaticConstants.RE_STRIP_INTRO.sub('', text).strip()
        
        if not any(kw in cleaned for kw in ['def ', 'class ', 'import ', 'from ']):
            return None

        stop_phrases = ("\n\nI hope this helps", "\n\nLet me know if you need", "I hope the refined code meets your expectations")
        for phrase in stop_phrases:
            idx = cleaned.find(phrase)
            if idx != -1:
                cleaned = cleaned[:idx].strip()
        
        return cleaned if len(cleaned) > 20 else None

# --- 6. INTELLIGENT MODEL MANAGER ---

class IntelligentModelManager:
    """Manages model loading with intelligent fallbacks on OOM, ensuring resources are optimized."""
    
    def __init__(self, config: LLMConfig, env: RuntimeEnvironment):
        
        if not (env.HAS_TRANSFORMERS and env.HAS_TORCH):
            raise DependencyError("Missing required libraries for LLM operations.")
        
        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
            self._AutoTokenizer = AutoTokenizer
            self._AutoModelForCausalLM = AutoModelForCausalLM
            self._BitsAndBytesConfig = BitsAndBytesConfig
        except ImportError as e:
            raise DependencyError(f"Failed to import necessary transformers components: {e}")

        self.config = config
        self.env = env
        self._model_instance: Optional[Any] = None
        self._tokenizer_instance: Optional[Any] = None
        self.current_model_size: str = config.MODEL_SIZE
        self._load_attempts = defaultdict(int)

        logging.info(f"🤖 Initializing Model Manager (target: {self.current_model_size})")

    @property
    def model(self) -> Optional[Any]:
        return self._model_instance
    
    @property
    def tokenizer(self) -> Optional[Any]:
        return self._tokenizer_instance
    
    def load_model(self, force_reload: bool = False) -> Tuple[Any, Any]:
        """Load model with intelligent, resource-aware fallback strategy."""
        
        if self._model_instance and not force_reload:
            return self._model_instance, self._tokenizer_instance

        attempt_model_size = self.config.MODEL_SIZE

        while attempt_model_size is not None:
            model_info = self.config.MODEL_OPTIONS.get(attempt_model_size)
            if model_info is None:
                raise ModelLoadingError(f"Invalid model size identifier: {attempt_model_size}")
            
            try:
                logging.info(f"📥 Attempting to load model: {attempt_model_size} ({model_info['name']})")
                
                model, tokenizer = self._load_specific_model(model_info)

                self.current_model_size = attempt_model_size
                self._model_instance = model
                self._tokenizer_instance = tokenizer
                self._load_attempts.clear()
                
                return model, tokenizer

            except (RuntimeError, ModelLoadingError) as e:
                error_msg = str(e).lower()
                is_oom = any(term in error_msg for term in ['memory', 'oom', 'cuda', 'device-side', 'allocator'])
                
                self._load_attempts[attempt_model_size] += 1
                attempts = self._load_attempts[attempt_model_size]
                
                logging.error(f"Load failed for {attempt_model_size} (Attempt {attempts}). OOM: {is_oom}. Error: {type(e).__name__}")

                fallback = model_info.get('fallback')
                
                if attempts >= StaticConstants.MAX_LOAD_ATTEMPTS and not is_oom:
                    fallback = None

                if fallback is None:
                    logging.critical("❌ CRITICAL: No further fallback options or max retries reached.")
                    memory_scrub(self.env.torch, self.env.psutil, self.env.HAS_GPU)
                    raise ModelLoadingError(f"Failed to load model {attempt_model_size} after exhaustive attempts.")
                    
                logging.warning(f"⚠️ Falling back from {attempt_model_size} to {fallback}.")
                attempt_model_size = fallback
                
                self._model_instance = None
                self._tokenizer_instance = None
                # Aggressive cleanup before attempting fallback
                memory_scrub(self.env.torch, self.env.psutil, self.env.HAS_GPU)
            
            except Exception as e:
                memory_scrub(self.env.torch, self.env.psutil, self.env.HAS_GPU)
                raise ModelLoadingError(f"An unexpected critical error occurred during loading: {e}")

        raise ModelLoadingError("Failed to load any configured model.")

    def _get_quantization_config(self, model_info: Dict[str, Any]) -> Tuple[Dict, str]:
        """Helper to determine appropriate quantization config and device map."""
        kwargs = {}
        device_map = "auto"
        
        if self.config.USE_GPU and self.env.torch:
            quantization_type = model_info.get('quantization')
            
            if quantization_type == "4bit":
                kwargs['quantization_config'] = self._BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_quant_type="nf4",
                    bnb_4bit_compute_dtype=self.config.DTYPE,
                    bnb_4bit_use_double_quant=True
                )
            elif quantization_type == "8bit":
                 kwargs['quantization_config'] = self._BitsAndBytesConfig(load_in_8bit=True)
            elif self.config.DTYPE:
                kwargs['torch_dtype'] = self.config.DTYPE
                
        else:
            device_map = "cpu"
            if self.env.torch:
                kwargs['torch_dtype'] = self.env.torch.float32 

        return kwargs, device_map

    def _load_specific_model(self, model_info: Dict[str, Any]) -> Tuple[Any, Any]:
        """Load a specific model size with optimized configuration."""
        
        model_name = model_info['name']
        kwargs, device_map = self._get_quantization_config(model_info)
        
        try:
            tokenizer = self._AutoTokenizer.from_pretrained(
                model_name, 
                cache_dir=self.config.MODEL_CACHE_DIR, 
                trust_remote_code=True
            )
            
            model = self._AutoModelForCausalLM.from_pretrained(
                model_name,
                device_map=device_map,
                cache_dir=self.config.MODEL_CACHE_DIR,
                low_cpu_mem_usage=True, 
                trust_remote_code=True,
                **kwargs
            )
        except Exception as e:
            raise RuntimeError(f"Failed to instantiate components for {model_name}: {e}")
        
        return model, tokenizer
    
    def generate(self, prompt: str, max_new_tokens: Optional[int] = None) -> str:
        """Runs inference using the currently loaded model, handling OOM gracefully."""
        if self._model_instance is None or self._tokenizer_instance is None:
            self.load_model()
        
        model_size = self.current_model_size
        model_info = self.config.MODEL_OPTIONS[model_size]
        max_new_tokens = max_new_tokens or model_info['max_tokens']
            
        logging.debug(f"Generating response (tokens: {max_new_tokens}) on {self.config.DEVICE} using {model_size}...")
        
        try:
            inputs = self._tokenizer_instance(
                prompt, 
                return_tensors="pt", 
                truncation=True
            ).to(self.config.DEVICE)
            
            gen_kwargs = {
                "max_new_tokens": max_new_tokens,
                "do_sample": True,
                "temperature": 0.7,
                "top_k": 50,
                "top_p": 0.95,
                "use_cache": True, 
                "pad_token_id": self._tokenizer_instance.pad_token_id or self._tokenizer_instance.eos_token_id,
                "eos_token_id": self._tokenizer_instance.eos_token_id
            }

            outputs = self._model_instance.generate(**inputs, **gen_kwargs)
            
            input_length = inputs.input_ids.shape[1]
            text = self._tokenizer_instance.decode(outputs[0][input_length:], skip_special_tokens=True).strip()
            return text
        
        except RuntimeError as e:
            error_msg = str(e).lower()
            if any(term in error_msg for term in ['memory', 'oom', 'cuda out of memory', 'device-side assert']):
                logging.error("Inference OOM detected. Scrubbing memory for potential recovery.")
                memory_scrub(self.env.torch, self.env.psutil, self.env.HAS_GPU)
            raise LLMInferenceError(f"Inference failed on device {self.config.DEVICE}: {e}")
        except Exception as e:
            raise LLMInferenceError(f"Inference failed due to an unknown error: {type(e).__name__}")

# --- 7. PIPELINE ENTRY POINT ---

class LLMPipeline:
    """
    Main orchestrator class for the LLM system. 
    Manages environment setup, configuration, and core operations.
    """

    def __init__(self, **config_overrides: Any):
        
        # 1. Initialize Environment
        self._env_manager = EnvironmentManager()
        self.env = self._env_manager.env
        
        # 2. Initialize Configuration (handles logging setup and resource checks)
        self._config_manager = ConfigManager(self.env, **config_overrides)
        self.config = self._config_manager.config
        
        # 3. Initialize Core Components
        self.extractor = RobustCodeExtractor()
        self.model_manager = IntelligentModelManager(self.config, self.env)

        logging.info("🚀 LLM Pipeline initialized successfully.")

    def generate_code(self, prompt: str, max_new_tokens: Optional[int] = None) -> Optional[str]:
        """
        Generates code based on the prompt using the loaded model and extracts 
        the final Python output robustly.
        """
        if not (self.env.HAS_TORCH and self.env.HAS_TRANSFORMERS):
            raise DependencyError("Cannot run inference: Core LLM dependencies are missing.")
            
        # Ensure model is loaded (will handle fallbacks internally)
        self.model_manager.load_model()

        # 1. Generate Raw Text
        raw_response = self.model_manager.generate(prompt, max_new_tokens=max_new_tokens)
        
        # 2. Extract Code
        extracted_code = self.extractor.extract(raw_response, prompt)
        
        if extracted_code is None:
            logging.warning("Failed to extract valid code from LLM response.")
            return raw_response # Return raw response as fallback for inspection
            
        return extracted_code

    def get_status(self) -> Dict[str, Any]:
        """Returns a summary of the current pipeline state."""
        return {
            "model_size": self.config.MODEL_SIZE,
            "device": self.config.DEVICE,
            "gpu_available": self.env.HAS_GPU,
            "current_model_name": self.config.MODEL_OPTIONS[self.model_manager.current_model_size]['name'] if self.model_manager.current_model_size in self.config.MODEL_OPTIONS else "N/A",
            "system_ram_gb": round(self.config.MEMORY_GB, 2),
            "log_level": self.config.LOG_LEVEL
        }

# Example Usage:
# try:
#     pipeline = LLMPipeline(MODEL_SIZE="medium", LOG_LEVEL="DEBUG")
#     code = pipeline.generate_code("Write a python function to calculate the Fibonacci sequence iteratively.")
#     print(code)
# except LLMBaseError as e:
#     print(f"Pipeline error: {e}")
# except Exception as e:
#     print(f"Unexpected error: {e}")

# --- EOF ---