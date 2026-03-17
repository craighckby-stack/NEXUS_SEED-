import { IRiskThresholdChecker, ComplianceResult } from '../../plugins/Compliance/RiskThresholdChecker';
import { IRiskFloorConfigRegistryKernel } from '../../config/IRiskFloorConfigRegistryKernel';

/**
 * Manages specialized risk floor compliance checks using an abstracted evaluation mechanism.
 * Adheres to the Kernel pattern for dependency management and configuration separation.
 */
export class RiskFloorComplianceKernel {
    private readonly checker: IRiskThresholdChecker;
    private readonly configRegistry: IRiskFloorConfigRegistryKernel;

    /**
     * Initializes the RiskFloorComplianceKernel with required dependencies.
     * @param checker - The risk threshold checker implementation.
     * @param configRegistry - The configuration registry for risk floor settings.
     * @throws {Error} If required dependencies are not provided.
     */
    constructor(
        { checker, configRegistry }: {
            checker: IRiskThresholdChecker;
            configRegistry: IRiskFloorConfigRegistryKernel;
        }
    ) {
        this.validateDependencies(checker, configRegistry);
        this.checker = checker;
        this.configRegistry = configRegistry;
    }

    /**
     * Validates that all required dependencies are provided.
     * @private
     */
    private validateDependencies(
        checker: IRiskThresholdChecker | undefined,
        configRegistry: IRiskFloorConfigRegistryKernel | undefined
    ): void {
        if (!checker) {
            throw new Error("IRiskThresholdChecker must be provided to RiskFloorComplianceKernel.");
        }
        if (!configRegistry) {
            throw new Error("IRiskFloorConfigRegistryKernel must be provided to RiskFloorComplianceKernel.");
        }
    }

    /**
     * Checks a set of critical operational metrics against predefined minimum thresholds (Risk Floors).
     *
     * @param currentOperationalMetrics - Key/value pairs of current measured metrics.
     * @returns The result of the compliance check.
     */
    public checkCoreOperationalRisk(currentOperationalMetrics: Record<string, number>): ComplianceResult {
        const coreRiskFloors = this.configRegistry.getCoreRiskFloors();
        return this.checker.evaluate(currentOperationalMetrics, coreRiskFloors);
    }
}
