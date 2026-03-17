const MetricType = {
    PERFORMANCE_INDICATOR: 'PERFORMANCE_INDICATOR',
    BUSINESS_LOGIC: 'BUSINESS_LOGIC',
    SYSTEM_HEALTH: 'SYSTEM_HEALTH',
    RESOURCE_UTILIZATION: 'RESOURCE_UTILIZATION',
    SECURITY: 'SECURITY'
};

const DataType = {
    INTEGER: 'INTEGER',
    FLOAT: 'FLOAT',
    BOOLEAN: 'BOOLEAN'
};

const AggregationMethod = {
    AVERAGE: 'AVERAGE',
    COUNT: 'COUNT',
    SUM: 'SUM',
    MAX: 'MAX',
    MIN: 'MIN',
    P50: 'P50',
    P95: 'P95',
    P99: 'P99'
};

const CriticalityLevel = {
    CRITICAL: 'CRITICAL',
    MAJOR: 'MAJOR',
    MINOR: 'MINOR',
    INFORMATIONAL: 'INFORMATIONAL'
};

module.exports = {
    MetricType,
    DataType,
    AggregationMethod,
    CriticalityLevel
};