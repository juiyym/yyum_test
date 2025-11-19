// 天气代码转中文映射表
function weatherCodeToCN(weathercode) {
    const codeMap = {
        0: '晴天',
        1: '大部分晴天',
        2: '部分多云',
        3: '阴天',
        45: '雾',
        48: '沉积霜雾',
        51: '轻毛毛雨',
        53: '中毛毛雨',
        55: '浓毛毛雨',
        56: '轻冻毛毛雨',
        57: '浓冻毛毛雨',
        61: '小雨',
        63: '中雨',
        65: '大雨',
        66: '轻冻雨',
        67: '重冻雨',
        71: '小雪',
        73: '中雪',
        75: '大雪',
        77: '雪粒',
        80: '小阵雨',
        81: '中阵雨',
        82: '大阵雨',
        85: '小阵雪',
        86: '大阵雪',
        95: '雷雨',
        96: '带冰雹的雷雨',
        99: '带冰雹的强雷雨'
    };
    return codeMap[weathercode] || '未知天气';
}

// 根据温度和风速生成穿搭建议（抖音风）
function getOutfitSuggestion(temp, wind) {
    const temperature = parseFloat(temp) || 20;
    
    // 抖音热门风格
    const styles = {
        hot: {
            style: "清爽夏日风",
            top: "白色 Oversize T 恤",
            bottom: "直筒牛仔短裤",
            shoes: "New Balance 530 / 轻跑鞋"
        },
        warm: {
            style: "韩系校园风",
            top: "宽松落肩长袖 Tee / 薄外套",
            bottom: "直筒休闲裤",
            shoes: "Converse 1970 / 小白鞋"
        },
        cool: {
            style: "奶油色简约风",
            top: "灰色落肩卫衣 / 奶油白针织",
            bottom: "深灰直筒裤",
            shoes: "New Balance 550（奶灰配色）"
        },
        cold: {
            style: "小红书秋冬风",
            top: "加绒卫衣 + 轻薄棉服",
            bottom: "黑色直筒裤",
            shoes: "Nike Dunk / 厚底运动鞋"
        },
        freeze: {
            style: "冬日通勤风",
            top: "短款羽绒服",
            bottom: "加绒直筒裤",
            shoes: "雪地靴 / 登山鞋"
        }
    };

    // 根据温度判断区间
    let selectedStyle;
    if (temperature >= 26) {
        selectedStyle = styles.hot;
    } else if (temperature >= 20) {
        selectedStyle = styles.warm;
    } else if (temperature >= 15) {
        selectedStyle = styles.cool;
    } else if (temperature >= 10) {
        selectedStyle = styles.cold;
    } else {
        selectedStyle = styles.freeze;
    }

    // 转换为兼容现有显示逻辑的格式
    return {
        style: selectedStyle.style,
        top: selectedStyle.top.split(' / '),
        bottom: selectedStyle.bottom.split(' / '),
        shoes: selectedStyle.shoes.split(' / '),
        accessories: []
    };
}

// 获取城市经纬度（使用 Open-Meteo 地理编码API）
async function getCityCoordinates(cityName) {
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=zh&format=json`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
            return {
                lat: data.results[0].latitude,
                lon: data.results[0].longitude,
                name: data.results[0].name
            };
        }
        throw new Error('城市未找到');
    } catch (error) {
        throw new Error('获取城市位置失败：' + error.message);
    }
}

// 从 Open-Meteo 获取天气数据
async function fetchWeatherFromOpenMeteo(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,weathercode`;
    
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('获取天气数据失败');
    }
    
    const data = await res.json();
    
    // 提取当前天气数据
    const current = data.current_weather;
    const hourly = data.hourly;
    
    // 获取当前小时的索引
    const now = new Date();
    const currentHour = now.getHours();
    
    return {
        temperature: current.temperature,
        weathercode: current.weathercode,
        windspeed: current.windspeed,
        humidity: hourly.relativehumidity_2m[currentHour] || hourly.relativehumidity_2m[0],
        weatherCN: weatherCodeToCN(current.weathercode)
    };
}

// 渲染天气（主函数）
async function renderWeather(lat, lon, cityName = '') {
    try {
        const weatherData = await fetchWeatherFromOpenMeteo(lat, lon);
        const outfit = getOutfitSuggestion(weatherData.temperature, weatherData.windspeed);
        
        // 显示天气信息
        displayWeatherData(weatherData, cityName || `${lat}, ${lon}`);
        
        // 显示穿搭推荐
        displayOutfitRecommendation(outfit, weatherData.temperature, weatherData.weatherCN);
        
        return { weather: weatherData, outfit };
    } catch (error) {
        console.error('渲染天气失败:', error);
        throw error;
    }
}

// 显示天气数据
function displayWeatherData(data, cityName) {
    const weatherContent = document.getElementById('weatherContent');
    const date = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    const icon = getWeatherIconByCode(data.weathercode);
    
    weatherContent.innerHTML = `
        <div class="weather-info">
            <div class="city-name">
                <h2>${cityName}</h2>
                <div class="date">${date}</div>
            </div>
            
            <div class="weather-main">
                <span class="weather-icon">${icon}</span>
                <div class="temperature">${Math.round(data.temperature)}°C</div>
                <div class="weather-description">${data.weatherCN}</div>
                <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 8px;">
                    体感温度 ${Math.round(data.temperature)}°C
                </div>
            </div>
            
            <div class="weather-details">
                <div class="detail-item">
                    <div class="detail-label">湿度</div>
                    <div class="detail-value">
                        ${Math.round(data.humidity)}<span class="detail-unit">%</span>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">风速</div>
                    <div class="detail-value">
                        ${data.windspeed.toFixed(1)}<span class="detail-unit">km/h</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    weatherContent.style.display = 'block';
}

// 根据天气代码获取图标
function getWeatherIconByCode(weathercode) {
    const iconMap = {
        0: '☀️',      // 晴天
        1: '🌤️',      // 大部分晴天
        2: '⛅',      // 部分多云
        3: '☁️',      // 阴天
        45: '🌫️',     // 雾
        48: '🌫️',     // 沉积霜雾
        51: '🌦️',     // 轻毛毛雨
        53: '🌦️',     // 中毛毛雨
        55: '🌦️',     // 浓毛毛雨
        61: '🌧️',     // 小雨
        63: '🌧️',     // 中雨
        65: '🌧️',     // 大雨
        71: '❄️',     // 小雪
        73: '❄️',     // 中雪
        75: '❄️',     // 大雪
        80: '🌦️',     // 小阵雨
        81: '🌦️',     // 中阵雨
        82: '🌦️',     // 大阵雨
        95: '⛈️',     // 雷雨
        96: '⛈️',     // 带冰雹的雷雨
        99: '⛈️'      // 带冰雹的强雷雨
    };
    return iconMap[weathercode] || '🌤️';
}

// 显示穿搭推荐
function displayOutfitRecommendation(outfit, temp, weatherDesc) {
    const outfitContent = document.getElementById('outfitContent');
    
    const iconMap = {
        top: '👕',
        bottom: '👖',
        shoes: '👟',
        accessories: '☂️'
    };

    const labelMap = {
        top: '上衣',
        bottom: '裤子',
        shoes: '鞋',
        accessories: '配件'
    };

    let itemsHTML = '<div class="outfit-items">';
    
    ['top', 'bottom', 'shoes', 'accessories'].forEach(key => {
        if (outfit[key] && outfit[key].length > 0) {
            const items = Array.isArray(outfit[key]) ? outfit[key] : [outfit[key]];
            const displayItems = items.join(' / ');
            
            itemsHTML += `
                <div class="outfit-item">
                    <span class="outfit-icon">${iconMap[key]}</span>
                    <span class="outfit-text">
                        <strong>${labelMap[key]}：</strong>${displayItems}
                    </span>
                </div>
            `;
        }
    });

    itemsHTML += '</div>';
    
    const topItems = Array.isArray(outfit.top) ? outfit.top[0] : outfit.top;
    const bottomItems = Array.isArray(outfit.bottom) ? outfit.bottom[0] : outfit.bottom;
    const shoesItems = Array.isArray(outfit.shoes) ? outfit.shoes[0] : outfit.shoes;
    
    let accessoriesText = '';
    if (outfit.accessories && outfit.accessories.length > 0) {
        accessoriesText = `，可带${outfit.accessories.join('、')}`;
    }

    const recommendation = `${topItems} + ${bottomItems} + ${shoesItems}${accessoriesText}。`;

    outfitContent.innerHTML = `
        <div class="outfit-info">
            <div class="outfit-title">今日穿搭推荐</div>
            
            ${itemsHTML}
            
            <div class="outfit-sentence">
                <div class="outfit-sentence-text">
                    今天 <span class="temperature">${Math.round(temp)}°C</span>，${weatherDesc}。推荐穿：<br>
                    <span class="recommendation">${recommendation}</span>
                </div>
            </div>
        </div>
    `;
}

// 天气应用主类
class WeatherApp {
    constructor() {
        this.init();
    }

    init() {
        this.elements = {
            cityInput: document.getElementById('cityInput'),
            searchBtn: document.getElementById('searchBtn'),
            weatherContent: document.getElementById('weatherContent'),
            outfitContent: document.getElementById('outfitContent'),
            loading: document.getElementById('loading'),
            errorMessage: document.getElementById('errorMessage')
        };

        this.bindEvents();
        this.loadLastCity();
    }

    bindEvents() {
        // 搜索按钮点击事件
        this.elements.searchBtn.addEventListener('click', () => this.searchWeather());
        
        // 回车键搜索
        this.elements.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchWeather();
            }
        });

        // 输入框聚焦时清除错误
        this.elements.cityInput.addEventListener('focus', () => {
            this.hideError();
        });
    }

    async searchWeather() {
        const city = this.elements.cityInput.value.trim();
        
        if (!city) {
            this.showError('请输入城市名称');
            return;
        }

        this.showLoading();
        this.hideError();
        this.hideWeather();

        try {
            // 获取城市经纬度
            const coords = await getCityCoordinates(city);
            // 渲染天气
            await renderWeather(coords.lat, coords.lon, coords.name);
            this.saveLastCity(city);
        } catch (error) {
            this.showError(error.message || '获取天气信息失败，请稍后重试');
        } finally {
            this.hideLoading();
        }
    }


    showLoading() {
        this.elements.loading.style.display = 'block';
        this.elements.searchBtn.disabled = true;
    }

    hideLoading() {
        this.elements.loading.style.display = 'none';
        this.elements.searchBtn.disabled = false;
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.style.display = 'block';
    }

    hideError() {
        this.elements.errorMessage.style.display = 'none';
    }

    hideWeather() {
        this.elements.weatherContent.innerHTML = '';
        // 同时重置穿搭推荐
        this.elements.outfitContent.innerHTML = `
            <div class="welcome-message">
                <h1>👔 穿搭推荐</h1>
                <p>根据天气自动推荐合适的穿搭</p>
            </div>
        `;
    }

    saveLastCity(city) {
        try {
            localStorage.setItem('weather_lastCity', city);
        } catch (e) {
            console.log('无法保存到本地存储');
        }
    }

    loadLastCity() {
        try {
            const lastCity = localStorage.getItem('weather_lastCity');
            if (lastCity) {
                this.elements.cityInput.value = lastCity;
                // 可选：自动加载上次的城市天气
                // this.searchWeather();
            }
        } catch (e) {
            console.log('无法从本地存储读取');
        }
    }

}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new WeatherApp();
    
    // 页面加载动画
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    // 示例：可以直接调用 renderWeather 函数
    // renderWeather(34.05, -118.24, '洛杉矶');
});


