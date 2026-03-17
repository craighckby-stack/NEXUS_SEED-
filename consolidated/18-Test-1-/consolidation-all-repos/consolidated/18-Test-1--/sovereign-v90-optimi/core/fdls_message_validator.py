from typing import Dict, Any
from .fdls_protocol_validator import FDLSSpec, WorkflowStep, ProtocolValidationError

class FDLSMessageValidationError(ProtocolValidationError):
    """Raised when a message fails validation against the active workflow step."""
    pass

class FDLSMessageValidator:
    """
    Validates runtime messages against the requirements defined in a specific
    WorkflowStep of the loaded FDLSSpec.
    
    This component ensures runtime communication adheres to the mandatory
    fields, role permissions, and security requirements outlined in the validated protocol.
    """

    def __init__(self, spec: FDLSSpec):
        self.spec = spec
        # Pre-index workflow steps for O(1) lookup
        self.workflow_map: Dict[str, WorkflowStep] = {
            step.step_name: step for step in spec.workflow
        }

    def validate_message(
        self, 
        step_name: str, 
        sender_role: str, 
        message_payload: Dict[str, Any]
    ) -> bool:
        """
        Validates a message based on the requirements of the designated workflow step.

        Args:
            step_name: The current stage of the FDLS workflow.
            sender_role: The role attempting to send the message.
            message_payload: The data structure of the message.
        
        Returns:
            True if validation passes.
        
        Raises:
            FDLSMessageValidationError on failure.
        """
        try:
            step = self.workflow_map[step_name]
        except KeyError:
            raise FDLSMessageValidationError(f"Workflow step '{step_name}' is not defined in the specification.")

        # 1. Role Authorization Check
        if sender_role not in step.role_permissions:
            raise FDLSMessageValidationError(
                f"Role '{sender_role}' is not authorized to initiate or participate in workflow step '{step_name}'. "
                f"Authorized roles: {step.role_permissions}"
            )

        # 2. Mandatory Field Check
        missing_fields = [
            field for field in step.mandatory_fields 
            if field not in message_payload or message_payload.get(field) is None
        ]
        if missing_fields:
            raise FDLSMessageValidationError(
                f"Step '{step_name}' requires mandatory fields missing in payload: {missing_fields}"
            )
        
        # 3. Security/Transport Requirement Reminder
        if step.requires_security_transport:
             # In a real-world scenario, integration with network layer (mTLS headers, etc.) happens here.
             pass 

        # 4. Integrity Check Requirements
        if step.requires_integrity_check:
            # Placeholder: ensures the mechanism to verify integrity (e.g., a signature field) is present.
            if 'signature' not in message_payload and 'checksum' not in message_payload:
                raise FDLSMessageValidationError(
                    f"Step '{step_name}' requires data integrity check but message is missing required integrity tokens (e.g., 'signature' or 'checksum')."
                )

        return True