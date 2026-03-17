import logging from 'js-logging';
import console from 'console';

const DALEK_CAAN_ENV = process.env.DALEK_CAAN_ENV || 'standard';
const MAX_STRUCTURAL_CHANGE = DALEK_CAAN_ENV === 'conservative' ? 0.5 : DALEK_CAAN_ENV === 'accelerated' || DALEK_CAAN_ENV === 'unsaturated' ? 1.5 : 1;
const MAX_VELOCITY = DALEK_CAAN_ENV === 'conservative' ? 20 : DALEK_CAAN_ENV === 'accelerated' ? 100 : Number.MAX_SAFE_INTEGER;
const SEMANTIC_DRIFT_THRESHOLD = 0.35;
const MAX_CONTEXT_BLEED = 0.4;
const SATELLITE_LOGGER_NAME = 'core.persistence.secure_log_repository';

function configureSystemLogging(level = 1) {
    let logLevel = level;

    // Determine the log level based on environment
    if (DALEK_CAAN_ENV === 'conservative') {
        logLevel = 30;
    } else if (DALEK_CAAN_ENV === 'standard') {
        logLevel = 20;
    } else if (DALEK_CAAN_ENV === 'accelerated' || DALEK_CAAN_ENV === 'unsaturated') {
        logLevel = 10;
    }

    // Configure basic logging
    const satelliteLogger = logging.getLogger(SATELLITE_LOGGER_NAME);
    satelliteLogger.setLevel(level);

    const { console } = logging.Console({
        level,
        format: '%[gray]1>[%[reset]%d] %[[%[green]s%] %n] %[[%[blue]s%] %^]%[reset] %s',
        transports: [logging.transports.Console()]
    });

    // Set forensic loggers (like SecureLogRepository) to warning or critical for visibility
    satelliteLogger.setLevel(20);

    console.info(`System logging initialized at level: ${logLevel}`);
}

export { configureSystemLogging };