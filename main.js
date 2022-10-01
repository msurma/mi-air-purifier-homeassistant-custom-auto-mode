const Homeassistant = require('node-homeassistant');

let ha = new Homeassistant({
    // host: '192.168.1.11',
    host: '127.0.0.1',
    token: '',
    protocol: 'ws',
    port: 8123
});

const config = {
    target_pm25: 5,
    max_level_at_pm25: 50,
    min_level: 2, // allowed range 0-14
    max_level: 14,
};

ha.on('connection', info => {
    console.log('connection changed', info);
});

ha.connect().then(() => {
    ha.on('state:fan.xiaomi_air_purifier_3h', data => {
        if (data.new_state.attributes.preset_mode !== 'Favorite') {
            console.log('Air Purifier not in Favorite mode, ignoring');
            return;
        }

        const fanSpeed = getFanSpeedLevel(parseInt(data.new_state.attributes.aqi));
        console.log('Got PM2.5: ' + data.new_state.attributes.aqi);
        setFanSpeed(fanSpeed);
    });
});

let lastFanLevel;
function setFanSpeed(fanLevel) {
    if (lastFanLevel === fanLevel) {
        console.log('Fan level ' + fanLevel + ' was already set');
        return;
    }

    ha.call({
        domain: 'xiaomi_miio_airpurifier',
        service: 'fan_set_favorite_level',
        service_data: { level: fanLevel }
    });
    lastFanLevel = fanLevel;

    console.log('Fan level ' + fanLevel + ' has been set');
}

function getFanSpeedLevel(currentPm25) {
    if (currentPm25 <= config.target_pm25) {
        return config.min_level;
    }

    if (currentPm25 >= config.max_level_at_pm25) {
        return config.max_level;
    }

    const fanSpeed = config.max_level * getFanSpeedPercentage(currentPm25);
    return Math.round(fanSpeed);
}

function getFanSpeedPercentage(currentPm25) {
    return (currentPm25 - config.target_pm25) / (config.max_level_at_pm25 - config.target_pm25);
}
