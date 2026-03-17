// 1-2. Construct the full telemetry payload, integrating decision factors and constraint details.
    const decisionPayload = this._buildDecisionTelemetryPayload(
        finalRate,
        requiredRate,
        calculationSource,
        restrictingConstraint
    );

    // 3. Dispatch standardized telemetry event.
    KERNEL_SYNERGY_CAPABILITIES.telemetry.log('AdaptiveSamplingDecision', decisionPayload);

    return finalRate;
}