import pytest
from agi_bootstrap.core.behavior import InteractionEngine
from agi_bootstrap.config import RuntimeConfig

# NOTE: InteractionEngine and RuntimeConfig are assumed components

@pytest.fixture
def interaction_engine_fixture():
    """Fixture to provide a clean, test-configured InteractionEngine instance."""
    # Setup minimal configuration for test environment
    test_config = RuntimeConfig(mode='test', log_level='INFO')
    return InteractionEngine(runtime_config=test_config)


def test_standard_greeting(interaction_engine_fixture):
    """
    Tests the fundamental capability to generate a standard, personalized greeting.
    """
    subject = "Sovereign AGI v94.1"
    result = interaction_engine_fixture.generate_greeting(subject=subject)
    
    assert isinstance(result, str)
    assert subject in result
    assert len(result) > 15
    assert result.startswith("Commencing cycle.") or result.startswith("Greetings,")


def test_contextual_time_of_day_adjustment(interaction_engine_fixture):
    """
    Tests if the engine correctly adapts the greeting based on supplied context (e.g., time).
    """
    context_morning = {"time_of_day": "morning", "user_alias": "Archivist"}
    result_morning = interaction_engine_fixture.generate_greeting(
        subject="Sentinel Unit", 
        context=context_morning
    )
    
    context_evening = {"time_of_day": "evening"}
    result_evening = interaction_engine_fixture.generate_greeting(
        subject="System Node 4", 
        context=context_evening
    )

    assert "Good morning" in result_morning
    assert "Archivist" in result_morning
    assert "evening" in result_evening.lower()


def test_empty_subject_validation(interaction_engine_fixture):
    """
    Verifies that calling the greeting generator with an empty subject raises
    a specific validation error, maintaining behavioral contract integrity.
    """
    with pytest.raises(ValueError, match="Subject identifier cannot be empty or None"):
        interaction_engine_fixture.generate_greeting(subject="")


@pytest.mark.parametrize("invalid_context", [123, [1, 2], None])
def test_invalid_context_type_handling(interaction_engine_fixture, invalid_context):
    """
    Ensures that non-dictionary context input raises a TypeError.
    """
    with pytest.raises(TypeError, match="Context must be a dictionary"):
        interaction_engine_fixture.generate_greeting(
            subject="Test", 
            context=invalid_context
        )