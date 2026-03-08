// 应用程序类
class RGBController {
    constructor() {
        // 全局变量
        this.bluetoothDevice = null;
        this.gattCharacteristic = null;
        this.currentColor = [255, 0, 0];
        
        // 存储每个灯珠的颜色状态
        this.pixelColors = Array(8).fill().map(() => Array(8).fill([0, 0, 0]));
        
        // 图案定义
        this.patterns = {
            heart: [
                [0,1,1,0,0,1,1,0],
                [1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1],
                [0,1,1,1,1,1,1,0],
                [0,0,1,1,1,1,0,0],
                [0,0,0,1,1,0,0,0],
                [0,0,0,0,0,0,0,0]
            ],
            star: [
                [0,0,0,1,1,0,0,0],
                [0,0,1,1,1,1,0,0],
                [0,1,1,1,1,1,1,0],
                [1,1,1,1,1,1,1,1],
                [0,1,1,1,1,1,1,0],
                [0,0,1,0,0,1,0,0],
                [0,1,0,0,0,0,1,0],
                [1,0,0,0,0,0,0,1]
            ],
            smile: [
                [0,0,1,1,1,1,0,0],
                [0,1,0,0,0,0,1,0],
                [1,0,1,0,0,1,0,1],
                [1,0,0,0,0,0,0,1],
                [1,0,1,0,0,1,0,1],
                [1,0,0,1,1,0,0,1],
                [0,1,0,0,0,0,1,0],
                [0,0,1,1,1,1,0,0]
            ],
            arrow: [
                [0,0,0,1,0,0,0,0],
                [0,0,1,1,0,0,0,0],
                [0,1,0,1,0,0,0,0],
                [1,1,1,1,1,1,1,1],
                [0,1,0,1,0,0,0,0],
                [0,0,1,1,0,0,0,0],
                [0,0,0,1,0,0,0,0],
                [0,0,0,1,0,0,0,0]
            ],
            chess: [
                [1,0,1,0,1,0,1,0],
                [0,1,0,1,0,1,0,1],
                [1,0,1,0,1,0,1,0],
                [0,1,0,1,0,1,0,1],
                [1,0,1,0,1,0,1,0],
                [0,1,0,1,0,1,0,1],
                [1,0,1,0,1,0,1,0],
                [0,1,0,1,0,1,0,1]
            ],
            clear: Array(8).fill().map(() => Array(8).fill(0))
        };
        
        // DOM 元素
        this.elements = {
            connectBtn: document.getElementById('connectBtn'),
            statusDiv: document.getElementById('status'),
            patternSelect: document.getElementById('patternSelect'),
            colorPickerMain: document.getElementById('colorPickerMain'),
            colorPicker: document.getElementById('colorPicker'),
            animationSelect: document.getElementById('animationSelect'),
            speedSlider: document.getElementById('speedSlider'),
            speedValue: document.getElementById('speedValue'),
            sendBtn: document.getElementById('sendBtn'),
            chatInput: document.getElementById('chatInput'),
            chatBtn: document.getElementById('chatBtn'),
            chatLog: document.getElementById('chatLog'),
            previewGrid: document.getElementById('previewGrid'),
            fillAllBtn: document.getElementById('fillAllBtn'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            sendCustomBtn: document.getElementById('sendCustomBtn'),
            imageUpload: document.getElementById('imageUpload'),
            processImageBtn: document.getElementById('processImageBtn'),
            imagePreview: document.getElementById('imagePreview'),
            colorPresets: document.getElementById('colorPresets')
        };
        
        // 初始化
        this.init();
    }
    
    // 初始化
    init() {
        this.setupEventListeners();
        this.updatePreview();
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 速度滑块事件
        if (this.elements.speedSlider) {
            this.elements.speedSlider.addEventListener('input', (e) => {
                if (this.elements.speedValue) {
                    this.elements.speedValue.textContent = e.target.value;
                }
            });
        }
        
        // 主颜色选择器事件
        if (this.elements.colorPickerMain) {
            this.elements.colorPickerMain.addEventListener('input', (e) => {
                this.currentColor = this.hexToRgb(e.target.value);
                if (this.elements.colorPicker) {
                    this.elements.colorPicker.value = e.target.value;
                }
                document.getElementById('currentColorValue').textContent = e.target.value;
                this.updatePreview();
            });
        }
        
        // 颜色选择器事件
        if (this.elements.colorPicker) {
            this.elements.colorPicker.addEventListener('input', (e) => {
                this.currentColor = this.hexToRgb(e.target.value);
                if (this.elements.colorPickerMain) {
                    this.elements.colorPickerMain.value = e.target.value;
                }
                document.getElementById('currentColorValue').textContent = e.target.value;
                this.updatePreview();
            });
        }
        
        // 颜色预设按钮事件
        if (this.elements.colorPresets) {
            this.elements.colorPresets.addEventListener('click', (e) => {
                if (e.target.classList.contains('color-preset')) {
                    if (e.target.classList.contains('add-color')) {
                        // 添加当前颜色到预设
                        const currentColorHex = this.elements.colorPicker ? this.elements.colorPicker.value : (this.elements.colorPickerMain ? this.elements.colorPickerMain.value : '#ff0000');
                        const newPreset = document.createElement('button');
                        newPreset.className = 'color-preset';
                        newPreset.dataset.color = currentColorHex;
                        newPreset.style.backgroundColor = currentColorHex;
                        // 插入到添加按钮之前
                        e.target.parentNode.insertBefore(newPreset, e.target);
                    } else {
                        // 选择预设颜色
                        const colorHex = e.target.dataset.color;
                        if (this.elements.colorPicker) {
                            this.elements.colorPicker.value = colorHex;
                        }
                        if (this.elements.colorPickerMain) {
                            this.elements.colorPickerMain.value = colorHex;
                        }
                        this.currentColor = this.hexToRgb(colorHex);
                        document.getElementById('currentColorValue').textContent = colorHex;
                        this.updatePreview();
                    }
                }
            });
        }
        
        // 图案选择事件
        if (this.elements.patternSelect) {
            this.elements.patternSelect.addEventListener('change', () => this.updatePreview());
        }
        
        // 预设效果按钮事件
        const effectPresets = document.querySelectorAll('.effect-preset');
        if (effectPresets.length > 0) {
            effectPresets.forEach(preset => {
                preset.addEventListener('click', (e) => {
                    const pattern = e.target.dataset.pattern;
                    const color = e.target.dataset.color;
                    const animation = e.target.dataset.animation;
                    const speed = e.target.dataset.speed;
                    
                    // 设置相应的控件值
                    if (this.elements.patternSelect) {
                        this.elements.patternSelect.value = pattern;
                    }
                    if (this.elements.colorPickerMain) {
                        this.elements.colorPickerMain.value = color;
                        this.currentColor = this.hexToRgb(color);
                        if (this.elements.colorPicker) {
                            this.elements.colorPicker.value = color;
                        }
                        document.getElementById('currentColorValue').textContent = color;
                    }
                    if (this.elements.animationSelect) {
                        this.elements.animationSelect.value = animation;
                    }
                    if (this.elements.speedSlider) {
                        this.elements.speedSlider.value = speed;
                        if (this.elements.speedValue) {
                            this.elements.speedValue.textContent = speed;
                        }
                    }
                    
                    // 更新预览
                    this.updatePreview();
                });
            });
        }
        
        // 连接按钮事件
        if (this.elements.connectBtn) {
            this.elements.connectBtn.addEventListener('click', () => this.connectToESP32());
        }
        
        // 发送按钮事件
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => this.sendCommand());
        }
        
        // 聊天发送事件
        if (this.elements.chatBtn) {
            this.elements.chatBtn.addEventListener('click', () => this.sendChat());
        }
        if (this.elements.chatInput) {
            this.elements.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChat();
                }
            });
        }
        
        // 填充所有按钮事件
        if (this.elements.fillAllBtn) {
            this.elements.fillAllBtn.addEventListener('click', () => this.fillAllPixels());
        }
        
        // 清空所有按钮事件
        if (this.elements.clearAllBtn) {
            this.elements.clearAllBtn.addEventListener('click', () => this.clearAllPixels());
        }
        
        // 发送自定义图案按钮事件
        if (this.elements.sendCustomBtn) {
            this.elements.sendCustomBtn.addEventListener('click', () => this.sendCustomPattern());
        }
        
        // 图片上传和处理事件
        if (this.elements.processImageBtn) {
            this.elements.processImageBtn.addEventListener('click', () => this.processImage());
        }
        
        // 灯珠点击事件
        const cells = document.querySelectorAll('.grid-cell');
        if (cells.length > 0) {
            cells.forEach(cell => {
                cell.addEventListener('click', (e) => {
                    const x = parseInt(e.target.dataset.x);
                    const y = parseInt(e.target.dataset.y);
                    this.togglePixel(x, y);
                });
            });
        }
    }
    
    // 十六进制转RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [255, 0, 0];
    }

    // 蓝牙连接
    async connectToESP32() {
        try {
            if (!this.elements.statusDiv || !this.elements.connectBtn) return;
            
            this.elements.statusDiv.textContent = '正在搜索...';
            
            // 检查浏览器兼容性
            if (!navigator.bluetooth) {
                throw new Error('您的浏览器不支持Web Bluetooth API');
            }
            
            // 请求蓝牙设备（显示所有有名字的设备）
            this.bluetoothDevice = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
            });
            
            console.log('找到设备:', this.bluetoothDevice.name, this.bluetoothDevice.id);
            
            // 连接到设备
            const server = await this.bluetoothDevice.gatt.connect();
            console.log('已连接到GATT服务器');
            
            // 获取服务
            try {
                const service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
                console.log('已获取服务');
                
                // 获取特征
                this.gattCharacteristic = await service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');
                console.log('已获取特征');
            } catch (error) {
                console.error('获取服务或特征失败:', error);
                throw new Error('无法连接到RGB控制器，请确保选择的是正确的ESP32设备');
            }
            
            // 监听特征变化
            await this.gattCharacteristic.startNotifications();
            this.gattCharacteristic.addEventListener('characteristicvaluechanged', (event) => this.handleCharacteristicValueChanged(event));
            console.log('已开始通知');
            
            this.elements.statusDiv.textContent = `已连接到 ${this.bluetoothDevice.name || '设备'}`;
            this.elements.connectBtn.textContent = '断开连接';
            this.elements.connectBtn.onclick = () => this.disconnectFromESP32();
            
            this.addChatMessage('系统', `已成功连接到 ${this.bluetoothDevice.name || '设备'}！`);
            
        } catch (error) {
            console.error('蓝牙连接错误:', error);
            if (this.elements.statusDiv) {
                this.elements.statusDiv.textContent = '连接失败';
            }
            this.addChatMessage('系统', `连接失败: ${error.message}`);
        }
    }

    // 断开蓝牙连接
    disconnectFromESP32() {
        if (this.bluetoothDevice && this.bluetoothDevice.gatt.connected) {
            this.bluetoothDevice.gatt.disconnect();
            if (this.elements.statusDiv) {
                this.elements.statusDiv.textContent = '未连接';
            }
            if (this.elements.connectBtn) {
                this.elements.connectBtn.textContent = '搜索蓝牙设备';
                this.elements.connectBtn.onclick = () => this.connectToESP32();
            }
            this.addChatMessage('系统', '已断开连接');
        }
    }

    // 处理特征值变化
    handleCharacteristicValueChanged(event) {
        if (!this.bluetoothDevice || !this.bluetoothDevice.gatt.connected) {
            return;
        }
        const value = event.target.value;
        const message = new TextDecoder().decode(value);
        this.addChatMessage('ESP32', message);
    }

    // 发送命令
    async sendCommand() {
        if (!this.gattCharacteristic || !this.bluetoothDevice || !this.bluetoothDevice.gatt.connected) {
            this.addChatMessage('系统', '请先连接蓝牙设备');
            this.showStatus('error', '请先连接蓝牙设备');
            return;
        }
        
        const pattern = this.elements.patternSelect ? this.elements.patternSelect.value : 'clear';
        const animation = this.elements.animationSelect ? this.elements.animationSelect.value : 'static';
        const speed = this.elements.speedSlider ? this.elements.speedSlider.value : '5';
        
        try {
            // 显示发送中状态
            this.showStatus('info', '正在发送命令...');
            
            // 检查是否为自定义模式（包括文字图案）
            if (pattern === 'custom') {
                // 收集非零像素数据
                let pixelData = [];
                for (let y = 0; y < 8; y++) {
                    for (let x = 0; x < 8; x++) {
                        const color = this.pixelColors[y][x];
                        if (color[0] > 0 || color[1] > 0 || color[2] > 0) {
                            const index = y * 8 + x;
                            // 将RGB颜色转换为单个32位整数
                            const colorInt = (index << 24) | (color[0] << 16) | (color[1] << 8) | color[2];
                            pixelData.push(colorInt);
                        }
                    }
                }
                
                // 检查是否有像素数据
                if (pixelData.length === 0) {
                    this.addChatMessage('系统', '请先绘制自定义图案');
                    this.showStatus('warning', '请先绘制自定义图案');
                    return;
                }
                
                // 将像素数据转换为Base64编码
                const uint8Array = new Uint8Array(pixelData.length * 4);
                for (let i = 0; i < pixelData.length; i++) {
                    uint8Array[i * 4] = (pixelData[i] >> 24) & 0xFF;
                    uint8Array[i * 4 + 1] = (pixelData[i] >> 16) & 0xFF;
                    uint8Array[i * 4 + 2] = (pixelData[i] >> 8) & 0xFF;
                    uint8Array[i * 4 + 3] = pixelData[i] & 0xFF;
                }
                
                // 使用Base64编码
                const compactPixels = btoa(String.fromCharCode.apply(null, uint8Array));
                
                // 处理动画代码
                let animationCode = animation.charAt(0);
                if (animation === 'breath') {
                    animationCode = 'br';
                } else if (animation === 'flow') {
                    animationCode = 'fl';
                } else if (animation === 'random') {
                    animationCode = 'r';
                }
                
                // 发送自定义图案数据
                const command = [
                    'c', // 图案类型（简化为单个字符）
                    compactPixels, // 像素数据（Base64编码）
                    animationCode, // 动画类型
                    parseInt(speed) // 速度（确保是数字类型）
                ];
                
                const commandString = JSON.stringify(command);
                const value = new TextEncoder().encode(commandString);
                
                console.log('发送的数据大小:', value.length, '字节');
                console.log('发送的数据:', commandString);
                
                // 检查数据大小是否超过蓝牙限制
                if (value.length > 500) {
                    this.addChatMessage('系统', `数据大小过大: ${value.length} 字节，请减少像素数量`);
                    this.showStatus('error', `数据大小过大，请减少像素数量`);
                    return;
                }
                
                await this.gattCharacteristic.writeValue(value);
                this.addChatMessage('我', `发送指令: 自定义图案`);
                this.addChatMessage('系统', `发送成功，数据大小: ${value.length} 字节`);
                this.showStatus('success', '发送成功');
            } else {
                // 已有图案
                const command = {
                    pattern: pattern,
                    color: this.currentColor,
                    animation: animation,
                    speed: parseInt(speed)
                };
                
                const commandString = JSON.stringify(command);
                const value = new TextEncoder().encode(commandString);
                
                await this.gattCharacteristic.writeValue(value);
                if (this.elements.patternSelect) {
                    this.addChatMessage('我', `发送指令: ${this.elements.patternSelect.options[this.elements.patternSelect.selectedIndex].text}`);
                    this.showStatus('success', '发送成功');
                }
            }
        } catch (error) {
            console.error('发送命令错误:', error);
            let errorMessage = '发送失败，请重试';
            if (error.message.includes('disconnected')) {
                errorMessage = '蓝牙连接已断开，请重新连接';
                if (this.elements.statusDiv) {
                    this.elements.statusDiv.textContent = '未连接';
                }
                if (this.elements.connectBtn) {
                    this.elements.connectBtn.textContent = '搜索蓝牙设备';
                    this.elements.connectBtn.onclick = () => this.connectToESP32();
                }
            }
            this.addChatMessage('系统', errorMessage);
            this.showStatus('error', errorMessage);
        }
    }

    // 显示状态消息
    showStatus(type, message) {
        // 创建状态消息元素
        const statusElement = document.createElement('div');
        statusElement.className = `status-message ${type}`;
        statusElement.textContent = message;
        statusElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        // 根据类型设置颜色
        switch (type) {
            case 'success':
                statusElement.style.backgroundColor = '#27ae60';
                break;
            case 'error':
                statusElement.style.backgroundColor = '#e74c3c';
                break;
            case 'warning':
                statusElement.style.backgroundColor = '#f39c12';
                break;
            case 'info':
                statusElement.style.backgroundColor = '#3498db';
                break;
        }
        
        // 添加到文档
        document.body.appendChild(statusElement);
        
        // 3秒后自动移除
        setTimeout(() => {
            statusElement.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (statusElement.parentNode) {
                    statusElement.parentNode.removeChild(statusElement);
                }
            }, 300);
        }, 3000);
    }

    // 添加聊天消息
    addChatMessage(sender, message) {
        if (!this.elements.chatLog) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender.toLowerCase()}`;
        messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
        this.elements.chatLog.appendChild(messageDiv);
        this.elements.chatLog.scrollTop = this.elements.chatLog.scrollHeight;
    }

    // 调用心流AI API
    async callAIApi(message) {
        // 心流API密钥
        const apiKey = "sk-702a75d364a75c4e12e67f919ff4fef6";
        const apiUrl = "https://apis.iflow.cn/v1/chat/completions";
        
        if (!apiKey) {
            this.addChatMessage('系统', 'API密钥未设置');
            return null;
        }
        
        try {
            // 系统提示 - 包含RGB灯板控制技能
            const systemPrompt = `# RGB灯板控制助手

## 设备信息
- RGB灯板类型：64位RGB灯板（8x8网格）
- 使用库：Adafruit_NeoPixel
- 灯数量：14个（实际可用灯珠）
- 控制方式：使用strip.setPixelColor(index, color)设置单个灯珠颜色
- 颜色顺序：Adafruit_NeoPixel库使用G, R, B顺序

## 坐标系统
- 灯板为8x8网格，坐标范围：x=0-7, y=0-7
- 索引计算：index = y * 8 + x
- 注意：由于实际只有14个灯珠，建议使用中心区域的灯珠

## 支持的控制模式
1. **静态模式**：所有灯保持同一颜色
2. **流水灯模式**：灯依次点亮
3. **颜色切换模式**：循环切换不同颜色
4. **彩虹模式**：显示彩虹效果
5. **关闭模式**：关闭所有灯
6. **自定义图案**：根据用户要求生成特定图案

## 颜色格式
- 使用RGB颜色值：[R, G, B]，范围0-255
- 亮度建议：为避免刺眼，建议使用0-100的亮度值

## 控制命令格式

### 1. 调用已有图案
当用户要求使用已有图案时，返回JSON格式：
{
  "pattern": "heart/star/rainbow/wave/smile/arrow/chess/clear",
  "color": [R, G, B],
  "animation": "static/fade/blink/breath/flow/random",
  "speed": 1-10
}

### 2. 生成自定义图案
当用户要求生成自定义图案时，返回JSON格式，其中pattern为"custom"，并在data字段中包含自定义图案数据：
{
  "pattern": "custom",
  "data": [
    [x1, y1, r1, g1, b1],
    [x2, y2, r2, g2, b2],
    ...
  ],
  "animation": "static/fade/blink",
  "speed": 1-10
}

其中：
- x, y: 灯珠坐标（0-7，8x8网格）
- r, g, b: 颜色值（0-255）

## 图案生成指南

### 圆形生成
要生成圆形，使用以下方法：
1. 确定圆心坐标 (cx, cy)
2. 确定半径 r
3. 遍历网格中的每个点 (x, y)
4. 计算点到圆心的距离：distance = sqrt((x-cx)^2 + (y-cy)^2)
5. 如果 distance <= r，则点亮该点

### 数字和字母生成
使用7段数码管的原理，或直接绘制点阵图形

### 心形生成
使用数学公式：(x² + y² - 1)³ - x²y³ ≤ 0

## 详细示例

### 示例1：生成圆形
- 用户输入："在中心显示红色圆形"
- 输出：{
  "pattern": "custom",
  "data": [
    [3,3,255,0,0], [4,3,255,0,0], [3,4,255,0,0], [4,4,255,0,0],
    [2,3,255,0,0], [5,3,255,0,0], [3,2,255,0,0], [4,2,255,0,0],
    [2,4,255,0,0], [5,4,255,0,0], [3,5,255,0,0], [4,5,255,0,0]
  ],
  "animation": "static",
  "speed": 5
}

### 示例2：生成数字8
- 用户输入："显示数字8"
- 输出：{
  "pattern": "custom",
  "data": [
    [1,1,0,0,255], [2,1,0,0,255], [1,2,0,0,255], [2,2,0,0,255],
    [1,3,0,0,255], [2,3,0,0,255], [1,4,0,0,255], [2,4,0,0,255],
    [1,5,0,0,255], [2,5,0,0,255]
  ],
  "animation": "static",
  "speed": 5
}

### 示例3：生成心形
- 用户输入："显示红色心形"
- 输出：{
  "pattern": "custom",
  "data": [
    [2,1,255,0,0], [3,1,255,0,0], [4,1,255,0,0],
    [1,2,255,0,0], [2,2,255,0,0], [3,2,255,0,0], [4,2,255,0,0], [5,2,255,0,0],
    [0,3,255,0,0], [1,3,255,0,0], [2,3,255,0,0], [3,3,255,0,0], [4,3,255,0,0], [5,3,255,0,0], [6,3,255,0,0],
    [1,4,255,0,0], [2,4,255,0,0], [3,4,255,0,0], [4,4,255,0,0], [5,4,255,0,0],
    [2,5,255,0,0], [3,5,255,0,0], [4,5,255,0,0],
    [3,6,255,0,0]
  ],
  "animation": "static",
  "speed": 5
}

### 示例4：生成波浪效果
- 用户输入："蓝色波浪效果"
- 输出：{
  "pattern": "custom",
  "data": [
    [0,3,0,0,255], [1,2,0,0,255], [2,3,0,0,255], [3,4,0,0,255],
    [4,3,0,0,255], [5,2,0,0,255], [6,3,0,0,255], [7,4,0,0,255]
  ],
  "animation": "fade",
  "speed": 7
}

## 非控制命令
当用户的问题不是关于控制灯板时，直接回答用户的问题，不需要返回JSON格式。`;
        
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen3-coder-plus",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                extra_body: {}
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知错误'}`);
        }
        
        const data = await response.json();
        console.log('完整API响应:', JSON.stringify(data, null, 2));
        
        // 检查是否有error字段
        if (data.error) {
            throw new Error(`API返回错误: ${data.error.message || '未知错误'}`);
        }
        
        if (!data.choices || data.choices.length === 0) {
            throw new Error('API返回的数据格式不正确，缺少choices字段');
        }
        
        if (!data.choices[0].message || !data.choices[0].message.content) {
            throw new Error('API返回的数据格式不正确，缺少message.content字段');
        }
        
        const aiResponse = data.choices[0].message.content;
        return aiResponse;
    } catch (error) {
        console.error("AI API调用错误:", error);
        this.addChatMessage('系统', `AI API调用失败: ${error.message}`);
        return null;
    }
}

    // 发送聊天
    async sendChat() {
        if (!this.elements.chatInput || !this.elements.chatLog) return;
        
        const message = this.elements.chatInput.value.trim();
        if (!message) return;
        
        this.addChatMessage('我', message);
        this.elements.chatInput.value = '';
        
        if (!this.gattCharacteristic || !this.bluetoothDevice || !this.bluetoothDevice.gatt.connected) {
            this.addChatMessage('系统', '请先连接蓝牙设备');
            return;
        }
        
        try {
            // 调用AI API
            this.addChatMessage('系统', '正在分析您的请求...');
            const aiResponse = await this.callAIApi(message);
            
            if (aiResponse) {
                console.log('AI返回的响应:', aiResponse);
                
                // 尝试解析AI返回的命令
                try {
                    const command = JSON.parse(aiResponse);
                    // 发送命令到ESP32
                    this.addChatMessage('AI', '已分析您的请求，正在执行...');
                    await this.sendAICommand(command);
                } catch (parseError) {
                    // 如果不是JSON格式，直接显示为聊天内容
                    this.addChatMessage('AI', aiResponse);
                }
            } else {
                this.addChatMessage('系统', 'AI服务暂时不可用，请稍后重试');
            }
        } catch (error) {
            console.error('发送消息错误:', error);
            this.addChatMessage('系统', '发送失败，请重试');
        }
    }

    // 发送AI生成的命令
    async sendAICommand(command) {
        let commandToSend;
        
        // 处理自定义图案
        if (command.pattern === 'custom' && command.data) {
            // 清空像素颜色数组
            this.pixelColors = Array(8).fill().map(() => Array(8).fill([0, 0, 0]));
            
            // 填充AI生成的图案数据
            let pixelData = [];
            command.data.forEach(([x, y, r, g, b]) => {
                // 确保坐标在有效范围内
                if (x >= 0 && x < 8 && y >= 0 && y < 8) {
                    // 更新像素颜色数组
                    this.pixelColors[y][x] = [r, g, b];
                    const index = y * 8 + x;
                    // 将RGB颜色转换为单个32位整数
                    const colorInt = (index << 24) | (r << 16) | (g << 8) | b;
                    pixelData.push(colorInt);
                }
            });
            
            // 切换到自定义模式
            if (this.elements.patternSelect) {
                this.elements.patternSelect.value = 'custom';
            }
            // 更新预览网格
            this.updatePreview();
            
            // 将像素数据转换为Base64编码
            const uint8Array = new Uint8Array(pixelData.length * 4);
            for (let i = 0; i < pixelData.length; i++) {
                uint8Array[i * 4] = (pixelData[i] >> 24) & 0xFF;
                uint8Array[i * 4 + 1] = (pixelData[i] >> 16) & 0xFF;
                uint8Array[i * 4 + 2] = (pixelData[i] >> 8) & 0xFF;
                uint8Array[i * 4 + 3] = pixelData[i] & 0xFF;
            }
            
            // 使用Base64编码
            const compactPixels = btoa(String.fromCharCode.apply(null, uint8Array));
            
            let animationCode = (command.animation || 'static').charAt(0);
            if ((command.animation || 'static') === 'breath') {
                animationCode = 'br';
            } else if ((command.animation || 'static') === 'flow') {
                animationCode = 'fl';
            } else if ((command.animation || 'static') === 'random') {
                animationCode = 'r';
            }
            
            commandToSend = [
                'c', // 图案类型（简化为单个字符）
                compactPixels, // 像素数据（Base64编码）
                animationCode, // 动画类型
                parseInt(command.speed) || 5 // 速度
            ];
        } else {
            // 已有图案
            commandToSend = command;
        }
        
        const commandString = JSON.stringify(commandToSend);
        const value = new TextEncoder().encode(commandString);
        
        console.log('发送的数据大小:', value.length, '字节');
        console.log('发送的数据:', commandString);
        
        // 检查数据大小是否超过蓝牙限制
        if (value.length > 500) {
            this.addChatMessage('系统', `数据大小过大: ${value.length} 字节，请减少像素数量`);
            return;
        }
        
        try {
            await this.gattCharacteristic.writeValue(value);
            this.addChatMessage('系统', `已执行命令: ${command.pattern}`);
            this.addChatMessage('系统', `发送成功，数据大小: ${value.length} 字节`);
        } catch (error) {
            console.error('发送命令错误:', error);
            this.addChatMessage('系统', '发送失败，请重试');
            // 重置连接状态
            if (error.message.includes('disconnected')) {
                if (this.elements.statusDiv) {
                    this.elements.statusDiv.textContent = '未连接';
                }
                if (this.elements.connectBtn) {
                    this.elements.connectBtn.textContent = '搜索蓝牙设备';
                    this.elements.connectBtn.onclick = () => this.connectToESP32();
                }
            }
        }
    }

    // 更新预览
    updatePreview() {
        const pattern = this.elements.patternSelect ? this.elements.patternSelect.value : 'clear';
        
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            
            // 如果选择了预设图案，使用图案数据
            if (pattern !== 'custom') {
                const patternData = this.patterns[pattern] || this.patterns.clear;
                if (patternData[y][x] === 1) {
                    cell.style.backgroundColor = `rgb(${this.currentColor[0]}, ${this.currentColor[1]}, ${this.currentColor[2]})`;
                    cell.classList.add('active');
                    // 更新像素颜色数组
                    this.pixelColors[y][x] = [...this.currentColor];
                } else {
                    cell.style.backgroundColor = '#333';
                    cell.classList.remove('active');
                    // 更新像素颜色数组
                    this.pixelColors[y][x] = [0, 0, 0];
                }
            } else {
                // 自定义模式，使用像素颜色数组
                const color = this.pixelColors[y][x];
                if (color[0] > 0 || color[1] > 0 || color[2] > 0) {
                    cell.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                    cell.classList.add('active');
                } else {
                    cell.style.backgroundColor = '#333';
                    cell.classList.remove('active');
                }
            }
        });
    }

    // 切换灯珠颜色
    togglePixel(x, y) {
        // 切换到自定义模式
        if (this.elements.patternSelect) {
            this.elements.patternSelect.value = 'custom';
        }
        
        // 检查当前灯珠是否激活
        const cell = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"]`);
        const currentPixelColor = this.pixelColors[y][x];
        
        // 如果当前是黑色，则设置为当前颜色
        if (currentPixelColor[0] === 0 && currentPixelColor[1] === 0 && currentPixelColor[2] === 0) {
            this.pixelColors[y][x] = [...this.currentColor];
        } else {
            // 否则设置为黑色
            this.pixelColors[y][x] = [0, 0, 0];
        }
        
        // 更新预览
        this.updatePreview();
    }

    // 填充所有灯珠
    fillAllPixels() {
        // 切换到自定义模式
        if (this.elements.patternSelect) {
            this.elements.patternSelect.value = 'custom';
        }
        
        // 填充所有灯珠为当前颜色
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                this.pixelColors[y][x] = [...this.currentColor];
            }
        }
        
        // 更新预览
        this.updatePreview();
    }

    // 清空所有灯珠
    clearAllPixels() {
        // 切换到自定义模式
        if (this.elements.patternSelect) {
            this.elements.patternSelect.value = 'custom';
        }
        
        // 清空所有灯珠
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                this.pixelColors[y][x] = [0, 0, 0];
            }
        }
        
        // 更新预览
        this.updatePreview();
    }

    // 处理上传的图片
    async processImage() {
        if (!this.elements.imageUpload || !this.elements.imagePreview) {
            this.addChatMessage('系统', '页面元素未加载完全');
            return;
        }
        
        const file = this.elements.imageUpload.files[0];
        if (!file) {
            this.addChatMessage('系统', '请先选择一张图片');
            return;
        }
        
        try {
            this.addChatMessage('系统', '正在处理图片...');
            
            // 创建图片元素
            const img = new Image();
            
            // 等待图片加载完成，添加错误处理
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('图片加载失败'));
                img.src = URL.createObjectURL(file);
            });
            
            console.log('图片加载成功，尺寸:', img.width, 'x', img.height);
            
            // 创建临时画布用于预处理
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            if (!tempCtx) {
                throw new Error('无法创建画布上下文');
            }
            
            // 设置临时画布大小为较大尺寸，以便更好地处理图像
            tempCanvas.width = 64;
            tempCanvas.height = 64;
            
            // 禁用图像平滑，保持边缘清晰
            if (tempCtx.imageSmoothingEnabled !== undefined) {
                tempCtx.imageSmoothingEnabled = false;
            }
            
            // 绘制并缩放图片到临时画布
            tempCtx.drawImage(img, 0, 0, 64, 64);
            
            // 获取临时画布的像素数据
            let imageData = tempCtx.getImageData(0, 0, 64, 64);
            let data = imageData.data;
            
            console.log('获取像素数据成功，长度:', data.length);
            
            // 应用图像增强
            try {
                data = this.enhanceImage(data, 64, 64);
                imageData.data = data;
                tempCtx.putImageData(imageData, 0, 0);
            } catch (enhanceError) {
                console.error('图像增强错误:', enhanceError);
                // 如果增强失败，继续使用原始数据
            }
            
            // 创建最终的8x8画布
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                throw new Error('无法创建8x8画布上下文');
            }
            
            canvas.width = 8;
            canvas.height = 8;
            
            // 禁用图像平滑，保持边缘清晰
            if (ctx.imageSmoothingEnabled !== undefined) {
                ctx.imageSmoothingEnabled = false;
            }
            
            // 从临时画布绘制到最终的8x8画布
            ctx.drawImage(tempCanvas, 0, 0, 8, 8);
            
            // 获取8x8画布的像素数据
            imageData = ctx.getImageData(0, 0, 8, 8);
            data = imageData.data;
            
            console.log('8x8像素数据获取成功，长度:', data.length);
            
            // 清空像素颜色数组
            this.pixelColors = Array(8).fill().map(() => Array(8).fill([0, 0, 0]));
            
            // 提取每个像素的颜色
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    const index = (y * 8 + x) * 4;
                    if (index + 2 < data.length) {
                        const r = data[index];
                        const g = data[index + 1];
                        const b = data[index + 2];
                        
                        // 应用颜色增强
                        try {
                            const enhancedColor = this.enhanceColor(r, g, b);
                            // 设置像素颜色
                            this.pixelColors[y][x] = enhancedColor;
                        } catch (colorError) {
                            console.error('颜色增强错误:', colorError);
                            // 如果增强失败，使用原始颜色
                            this.pixelColors[y][x] = [r, g, b];
                        }
                    }
                }
            }
            
            // 切换到自定义模式
            if (this.elements.patternSelect) {
                this.elements.patternSelect.value = 'custom';
            }
            // 更新预览网格
            this.updatePreview();
            
            // 显示处理前后的图片
            this.elements.imagePreview.innerHTML = '';
            
            // 原始图片预览
            const originalImg = document.createElement('div');
            originalImg.innerHTML = `<p>原始图片:</p><img src="${img.src}" alt="原始图片">`;
            this.elements.imagePreview.appendChild(originalImg);
            
            // 处理后图片预览
            const processedImg = document.createElement('div');
            const processedCanvas = document.createElement('canvas');
            processedCanvas.width = 120;
            processedCanvas.height = 120;
            const processedCtx = processedCanvas.getContext('2d');
            
            if (processedCtx) {
                // 放大绘制8x8像素
                for (let y = 0; y < 8; y++) {
                    for (let x = 0; x < 8; x++) {
                        const [r, g, b] = this.pixelColors[y][x];
                        processedCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                        processedCtx.fillRect(x * 15, y * 15, 15, 15);
                    }
                }
                
                processedImg.innerHTML = '<p>处理后 (8x8):</p>';
                processedImg.appendChild(processedCanvas);
                this.elements.imagePreview.appendChild(processedImg);
            }
            
            this.addChatMessage('系统', '图片处理完成，已转换为8x8像素');
            
        } catch (error) {
            console.error('图片处理错误:', error);
            this.addChatMessage('系统', `图片处理失败: ${error.message}`);
        }
    }

    // 图像增强函数
    enhanceImage(data, width, height) {
        const newData = new Uint8ClampedArray(data.length);
        
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            
            // 增加对比度
            const contrast = 1.2; // 对比度因子
            r = Math.min(255, Math.max(0, (r - 128) * contrast + 128));
            g = Math.min(255, Math.max(0, (g - 128) * contrast + 128));
            b = Math.min(255, Math.max(0, (b - 128) * contrast + 128));
            
            // 增加亮度
            const brightness = 10; // 亮度增量
            r = Math.min(255, r + brightness);
            g = Math.min(255, g + brightness);
            b = Math.min(255, b + brightness);
            
            // 增加饱和度
            const saturation = 1.3; // 饱和度因子
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = Math.min(255, Math.max(0, gray + (r - gray) * saturation));
            g = Math.min(255, Math.max(0, gray + (g - gray) * saturation));
            b = Math.min(255, Math.max(0, gray + (b - gray) * saturation));
            
            newData[i] = r;
            newData[i + 1] = g;
            newData[i + 2] = b;
            newData[i + 3] = data[i + 3]; // 保持透明度
        }
        
        return newData;
    }

    // 颜色增强函数
    enhanceColor(r, g, b) {
        // 计算亮度
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // 如果亮度太低，增加亮度
        if (brightness < 50) {
            const factor = 1.5;
            r = Math.min(255, r * factor);
            g = Math.min(255, g * factor);
            b = Math.min(255, b * factor);
        }
        
        // 颜色量化 - 减少颜色数量以获得更鲜明的效果
        const quantize = 32; // 量化步长
        r = Math.round(r / quantize) * quantize;
        g = Math.round(g / quantize) * quantize;
        b = Math.round(b / quantize) * quantize;
        
        // 确保颜色值在有效范围内
        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));
        
        return [r, g, b];
    }

    // 发送自定义图案
    async sendCustomPattern() {
        if (!this.gattCharacteristic || !this.bluetoothDevice || !this.bluetoothDevice.gatt.connected) {
            this.addChatMessage('系统', '请先连接蓝牙设备');
            return;
        }
        
        const animation = this.elements.animationSelect ? this.elements.animationSelect.value : 'static';
        const speed = this.elements.speedSlider ? this.elements.speedSlider.value : '5';
        
        // 优化数据结构，使用极紧凑的编码方式
        // 使用Base64编码压缩数据
        let pixelData = [];
        let pixelCount = 0;
        
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const color = this.pixelColors[y][x];
                if (color[0] > 0 || color[1] > 0 || color[2] > 0) {
                    const index = y * 8 + x;
                    // 将RGB颜色转换为单个32位整数
                    const colorInt = (index << 24) | (color[0] << 16) | (color[1] << 8) | color[2];
                    pixelData.push(colorInt);
                    pixelCount++;
                }
            }
        }
        
        // 将像素数据转换为Base64编码
        const uint8Array = new Uint8Array(pixelData.length * 4);
        for (let i = 0; i < pixelData.length; i++) {
            uint8Array[i * 4] = (pixelData[i] >> 24) & 0xFF;
            uint8Array[i * 4 + 1] = (pixelData[i] >> 16) & 0xFF;
            uint8Array[i * 4 + 2] = (pixelData[i] >> 8) & 0xFF;
            uint8Array[i * 4 + 3] = pixelData[i] & 0xFF;
        }
        
        // 使用Base64编码
        const compactPixels = btoa(String.fromCharCode.apply(null, uint8Array));
        
        // 发送自定义图案数据
        let animationCode = animation.charAt(0);
        if (animation === 'breath') {
            animationCode = 'br';
        } else if (animation === 'flow') {
            animationCode = 'fl';
        } else if (animation === 'random') {
            animationCode = 'r';
        } else if (animation === 'scroll') {
            animationCode = 'sc';
        }
        
        const command = [
            'c', // 图案类型（简化为单个字符）
            compactPixels, // 像素数据（Base64编码）
            animationCode, // 动画类型
            parseInt(speed) // 速度（确保是数字类型）
        ];
        
        const commandString = JSON.stringify(command);
        const value = new TextEncoder().encode(commandString);
        
        console.log('发送的数据大小:', value.length, '字节');
        console.log('发送的数据:', commandString);
        console.log('像素数量:', pixelCount);
        
        // 检查数据大小是否超过蓝牙限制
        if (value.length > 500) { // 蓝牙GATT特征的最大限制是512字节
            this.addChatMessage('系统', `数据大小过大: ${value.length} 字节，请减少像素数量`);
            return;
        }
        
        try {
            await this.gattCharacteristic.writeValue(value);
            this.addChatMessage('我', '发送自定义图案');
            this.addChatMessage('系统', `发送成功，数据大小: ${value.length} 字节`);
            this.addChatMessage('系统', `像素数量: ${pixelCount}`);
        } catch (error) {
            console.error('发送命令错误:', error);
            this.addChatMessage('系统', `发送失败: ${error.message}`);
            // 重置连接状态
            if (error.message.includes('disconnected')) {
                if (this.elements.statusDiv) {
                    this.elements.statusDiv.textContent = '未连接';
                }
                if (this.elements.connectBtn) {
                    this.elements.connectBtn.textContent = '搜索蓝牙设备';
                    this.elements.connectBtn.onclick = () => this.connectToESP32();
                }
                this.addChatMessage('系统', '蓝牙连接已断开，请重新连接');
            }
        }
    }
}

// 初始化
const rgbController = new RGBController();
