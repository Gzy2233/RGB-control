#include <Adafruit_NeoPixel.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// RGB 灯配置
#define LED_PIN     6       // 黄线 - PWM数据信号
#define LED_COUNT   64      // 64位灯板
#define MATRIX_WIDTH 8
#define MATRIX_HEIGHT 8

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

// BLE 配置
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// 全局变量
BLEServer *pServer = NULL;
BLECharacteristic *pCharacteristic = NULL;
bool deviceConnected = false;

// 命令队列
String commandQueue[10];
int queueHead = 0;
int queueTail = 0;
const int QUEUE_SIZE = 10;
const int MAX_COMMAND_LENGTH = 1024;

// 动画状态
String currentPattern = "clear";
int currentColor[3] = {255, 0, 0};
String currentAnimation = "static";
int currentSpeed = 5;

// 图案定义
byte heart[8][8] = {
  {0,1,1,0,0,1,1,0},
  {1,1,1,1,1,1,1,1},
  {1,1,1,1,1,1,1,1},
  {1,1,1,1,1,1,1,1},
  {0,1,1,1,1,1,1,0},
  {0,0,1,1,1,1,0,0},
  {0,0,0,1,1,0,0,0},
  {0,0,0,0,0,0,0,0}
};

byte star[8][8] = {
  {0,0,0,1,1,0,0,0},
  {0,0,1,1,1,1,0,0},
  {0,1,1,1,1,1,1,0},
  {1,1,1,1,1,1,1,1},
  {0,1,1,1,1,1,1,0},
  {0,0,1,0,0,1,0,0},
  {0,1,0,0,0,0,1,0},
  {1,0,0,0,0,0,0,1}
};

// 存储自定义图案的颜色数据
int customPixelColors[8][8][3] = {0};

// 函数声明
void processCommand(String data);
void sendMessage(String message);
void executeCommand(String pattern, int color[3], String animation, int speed);
void drawCustomPattern();
void drawPattern(byte pattern[8][8], int r, int g, int b);
void rainbowEffect();
void waveEffect(int r, int g, int b, int speed);
void fadeAnimation(int speed);
void blinkAnimation(int speed);
void clearMatrix();
uint32_t Wheel(byte WheelPos);
String base64Decode(String encoded);

// BLE 服务器回调
class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("设备已连接");
    sendMessage("已成功连接到ESP32 RGB控制器");
  };
  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("设备已断开");
    // 重新开始广播
    pServer->startAdvertising();
  }
};

// BLE 特征回调
class MyCharacteristicCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue();
    if (value.length() > 0) {
      // 检查命令长度，避免处理过长的命令
      if (value.length() > MAX_COMMAND_LENGTH) {
        Serial.println("命令过长，丢弃命令");
        sendMessage("错误：命令过长");
        return;
      }
      
      Serial.println("收到: " + value);
      // 将命令添加到队列中
      int nextTail = (queueTail + 1) % QUEUE_SIZE;
      if (nextTail != queueHead) {
        commandQueue[queueTail] = value;
        queueTail = nextTail;
      } else {
        Serial.println("命令队列已满，丢弃命令");
        sendMessage("错误：命令队列已满");
      }
    }
  }
};

void setup() {
  Serial.begin(115200);
  
  // 初始化 RGB 灯
  strip.begin();
  strip.setBrightness(100);
  strip.show();
  
  // 初始化 BLE
  BLEDevice::init("RGB-Controller");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_WRITE |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pCharacteristic->addDescriptor(new BLE2902());
  pCharacteristic->setCallbacks(new MyCharacteristicCallbacks());
  
  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // 设置最小广播间隔
  pAdvertising->setMaxPreferred(0x12);  // 设置最大广播间隔
  BLEDevice::startAdvertising();
  
  Serial.println("BLE 服务已启动，等待连接...");
  
  // 启动时默认显示彩虹效果
  currentPattern = "rainbow";
  currentAnimation = "fade";
  currentSpeed = 5;
  executeCurrentAnimation();
}

void loop() {
  // 处理队列中的命令
  if (queueHead != queueTail) {
    String command = commandQueue[queueHead];
    queueHead = (queueHead + 1) % QUEUE_SIZE;
    processCommand(command);
  }
  
  // 持续执行当前动画
  executeCurrentAnimation();
  
  // 避免使用delay，使用非阻塞方式
  yield();
}

// 图案定义
byte smile[8][8] = {
  {0,0,1,1,1,1,0,0},
  {0,1,0,0,0,0,1,0},
  {1,0,1,0,0,1,0,1},
  {1,0,0,0,0,0,0,1},
  {1,0,1,0,0,1,0,1},
  {1,0,0,1,1,0,0,1},
  {0,1,0,0,0,0,1,0},
  {0,0,1,1,1,1,0,0}
};

byte arrow[8][8] = {
  {0,0,0,1,0,0,0,0},
  {0,0,1,1,0,0,0,0},
  {0,1,0,1,0,0,0,0},
  {1,1,1,1,1,1,1,1},
  {0,1,0,1,0,0,0,0},
  {0,0,1,1,0,0,0,0},
  {0,0,0,1,0,0,0,0},
  {0,0,0,1,0,0,0,0}
};

byte chess[8][8] = {
  {1,0,1,0,1,0,1,0},
  {0,1,0,1,0,1,0,1},
  {1,0,1,0,1,0,1,0},
  {0,1,0,1,0,1,0,1},
  {1,0,1,0,1,0,1,0},
  {0,1,0,1,0,1,0,1},
  {1,0,1,0,1,0,1,0},
  {0,1,0,1,0,1,0,1}
};

// 执行当前动画
void executeCurrentAnimation() {
    // 执行当前图案
    if (currentPattern == "heart") {
        drawPattern(heart, currentColor[0], currentColor[1], currentColor[2]);
    } else if (currentPattern == "star") {
        drawPattern(star, currentColor[0], currentColor[1], currentColor[2]);
    } else if (currentPattern == "smile") {
        drawPattern(smile, currentColor[0], currentColor[1], currentColor[2]);
    } else if (currentPattern == "arrow") {
        drawPattern(arrow, currentColor[0], currentColor[1], currentColor[2]);
    } else if (currentPattern == "chess") {
        drawPattern(chess, currentColor[0], currentColor[1], currentColor[2]);
    } else if (currentPattern == "rainbow") {
        rainbowEffect();
    } else if (currentPattern == "wave") {
        waveEffect(currentColor[0], currentColor[1], currentColor[2], currentSpeed);
    } else if (currentPattern == "custom") {
        drawCustomPattern();
    } else if (currentPattern == "clear") {
        clearMatrix();
    }
    
    // 执行当前动画
    if (currentAnimation == "fade") {
        fadeAnimation(currentSpeed);
    } else if (currentAnimation == "blink") {
        blinkAnimation(currentSpeed);
    } else if (currentAnimation == "breath") {
        breathAnimation(currentSpeed);
    } else if (currentAnimation == "flow") {
        flowAnimation(currentSpeed);
    } else if (currentAnimation == "random") {
        randomAnimation(currentSpeed);
    }
    
    // 使用非阻塞延迟，提高响应速度
    delayMicroseconds(50000); // 50ms
}

// 处理命令
void processCommand(String data) {
  // 尝试解析 JSON
  if (data.startsWith("{") && data.endsWith("}")) {
    // 简单的 JSON 解析
    parseJsonCommand(data);
  } else if (data.startsWith("[")) {
    // 解析数组格式命令
    parseArrayCommand(data);
  } else {
    // 处理文本命令
    parseTextCommand(data);
  }
}

// 解析数组格式命令
void parseArrayCommand(String json) {
  Serial.println("解析数组格式命令");
  Serial.println("收到的命令: " + json);
  
  // 初始化命令为默认值
  String pattern = "clear";
  int color[3] = {255, 0, 0};
  String animation = "static";
  int speed = 5;
  int pixelCount = 0;
  
  // 提取 pattern
  int patternPos = json.indexOf("\"", 1);
  if (patternPos != -1) {
    int nextQuotePos = json.indexOf("\"", patternPos + 1);
    if (nextQuotePos != -1) {
      pattern = json.substring(patternPos + 1, nextQuotePos);
      Serial.print("解析到 pattern: ");
      Serial.println(pattern);
      
      // 处理简化的图案类型
      if (pattern == "c") {
        pattern = "custom";
      }
    }
  }
  
  // 提取像素数据（如果是自定义图案）
  if (pattern == "custom") {
    // 先清空所有像素为黑色
    for (int y = 0; y < 8; y++) {
      for (int x = 0; x < 8; x++) {
        customPixelColors[y][x][0] = 0;
        customPixelColors[y][x][1] = 0;
        customPixelColors[y][x][2] = 0;
      }
    }
    
    // 找到像素数据的开始位置
    int pixelsStart = json.indexOf("\"", json.indexOf(","));
    if (pixelsStart != -1) {
      // 找到像素数据的结束位置
      int pixelsEnd = json.indexOf("\"", pixelsStart + 1);
      if (pixelsEnd != -1) {
        // 提取像素数据
        String pixelsStr = json.substring(pixelsStart + 1, pixelsEnd);
        Serial.println("像素数据: " + pixelsStr);
        
        // 解码Base64数据
        String decodedData = base64Decode(pixelsStr);
        Serial.println("解码后长度: " + String(decodedData.length()));
        
        // 解析像素数据 - 每4字节一个像素（索引+RGB）
        for (int i = 0; i + 3 < decodedData.length(); i += 4) {
          // 解析索引（1字节）
          int index = (unsigned char)decodedData.charAt(i);
          
          // 解析RGB颜色（3字节）
          int r = (unsigned char)decodedData.charAt(i + 1);
          int g = (unsigned char)decodedData.charAt(i + 2);
          int b = (unsigned char)decodedData.charAt(i + 3);
          
          // 转换为x, y坐标
          int y = index / 8;
          int x = index % 8;
          
          // 设置像素颜色
          if (x >= 0 && x < 8 && y >= 0 && y < 8) {
            customPixelColors[y][x][0] = r;
            customPixelColors[y][x][1] = g;
            customPixelColors[y][x][2] = b;
            pixelCount++;
          }
        }
        
        Serial.print("解析到像素数量: ");
        Serial.println(pixelCount);
      }
    }
  }
  
  // 提取 animation
  // 找到第二个逗号的位置（在像素数据和动画代码之间）
  int firstComma = json.indexOf(",");
  int secondComma = json.indexOf(",", firstComma + 1);
  if (secondComma != -1) {
    // 找到第二个逗号之后的第一个双引号的位置（动画代码的开始位置）
    int animationPos = json.indexOf("\"", secondComma + 1);
    if (animationPos != -1) {
      // 找到动画代码的结束位置
      int nextQuotePos = json.indexOf("\"", animationPos + 1);
      if (nextQuotePos != -1) {
        String animationCode = json.substring(animationPos + 1, nextQuotePos);
        Serial.print("解析到 animation code: ");
        Serial.println(animationCode);
        
        // 处理简化的动画类型
          if (animationCode == "s") {
              animation = "static";
          } else if (animationCode == "f") {
              animation = "fade";
          } else if (animationCode == "b") {
              animation = "blink";
          } else if (animationCode == "br") {
              animation = "breath";
          } else if (animationCode == "fl") {
              animation = "flow";
          } else if (animationCode == "r") {
              animation = "random";
          } else {
              animation = "static";
          }
        Serial.print("解析到 animation: ");
        Serial.println(animation);
      }
    }
  }
  
  // 提取 speed
  int speedPos = json.lastIndexOf(",");
  if (speedPos != -1) {
    String speedStr = json.substring(speedPos + 1, json.length() - 1);
    speed = constrain(speedStr.toInt(), 1, 10);
    Serial.print("解析到 speed: ");
    Serial.println(speed);
  }
  
  // 执行命令
  executeCommand(pattern, color, animation, speed);
  
  // 发送确认
  String response = "已执行命令: " + pattern;
  if (pattern == "custom") {
    response += "，像素数量: " + String(pixelCount);
  }
  sendMessage(response);
  Serial.println("命令执行完成");
}

// 解析JSON命令
void parseJsonCommand(String json) {
    Serial.println("解析对象格式命令");
    Serial.println("收到的命令: " + json);
    
    // 初始化命令为默认值
    String pattern = "clear";
    int color[3] = {255, 0, 0};
    String animation = "static";
    int speed = 5;
    
    // 提取 pattern
    int patternPos = json.indexOf("pattern");
    if (patternPos != -1) {
        int colonPos = json.indexOf(":", patternPos);
        if (colonPos != -1) {
            int quotePos = json.indexOf('"', colonPos);
            if (quotePos != -1) {
                int nextQuotePos = json.indexOf('"', quotePos + 1);
                if (nextQuotePos != -1) {
                    pattern = json.substring(quotePos + 1, nextQuotePos);
                    Serial.print("解析到 pattern: ");
                    Serial.println(pattern);
                }
            }
        }
    }
    
    // 提取 color
    int colorPos = json.indexOf("color");
    if (colorPos != -1) {
        int colonPos = json.indexOf(":", colorPos);
        if (colonPos != -1) {
            int bracketPos = json.indexOf('[', colonPos);
            if (bracketPos != -1) {
                int endBracketPos = json.indexOf(']', bracketPos);
                if (endBracketPos != -1) {
                    String colorStr = json.substring(bracketPos + 1, endBracketPos);
                    int comma1 = colorStr.indexOf(',');
                    int comma2 = colorStr.indexOf(',', comma1 + 1);
                    if (comma1 > 0 && comma2 > comma1) {
                        color[0] = constrain(colorStr.substring(0, comma1).toInt(), 0, 255);
                        color[1] = constrain(colorStr.substring(comma1 + 1, comma2).toInt(), 0, 255);
                        color[2] = constrain(colorStr.substring(comma2 + 1).toInt(), 0, 255);
                        Serial.print("解析到 color: ");
                        Serial.print(color[0]);
                        Serial.print(",");
                        Serial.print(color[1]);
                        Serial.print(",");
                        Serial.println(color[2]);
                    }
                }
            }
        }
    }
    
    // 提取 animation
    int animationPos = json.indexOf("animation");
    if (animationPos != -1) {
        int colonPos = json.indexOf(":", animationPos);
        if (colonPos != -1) {
            int quotePos = json.indexOf('"', colonPos);
            if (quotePos != -1) {
                int nextQuotePos = json.indexOf('"', quotePos + 1);
                if (nextQuotePos != -1) {
                    animation = json.substring(quotePos + 1, nextQuotePos);
                    Serial.print("解析到 animation: ");
                    Serial.println(animation);
                }
            }
        }
    }
    
    // 提取 speed
    int speedPos = json.indexOf("speed");
    if (speedPos != -1) {
        int colonPos = json.indexOf(":", speedPos);
        if (colonPos != -1) {
            int valueStart = colonPos + 1;
            while (valueStart < json.length() && (json[valueStart] == ' ' || json[valueStart] == '\t')) {
                valueStart++;
            }
            int valueEnd = valueStart;
            while (valueEnd < json.length() && isdigit(json[valueEnd])) {
                valueEnd++;
            }
            if (valueEnd > valueStart) {
                speed = constrain(json.substring(valueStart, valueEnd).toInt(), 1, 10);
                Serial.print("解析到 speed: ");
                Serial.println(speed);
            }
        }
    }
    
    // 执行命令
    executeCommand(pattern, color, animation, speed);
    
    // 发送确认
    String response = "已执行命令: " + pattern;
    sendMessage(response);
    Serial.println("命令执行完成");
}

// 解析文本命令
void parseTextCommand(String text) {
  text.toLowerCase();
  
  // 检查是否为对话内容
  if (isChatMessage(text)) {
    handleChatMessage(text);
    return;
  }
  
  // 处理图案命令
  String pattern = "clear";
  int color[3] = {255, 0, 0};
  String animation = "static";
  int speed = 5;
  
  if (text.indexOf("爱心") >= 0 || text.indexOf("heart") >= 0) {
    pattern = "heart";
  } else if (text.indexOf("星星") >= 0 || text.indexOf("star") >= 0) {
    pattern = "star";
  } else if (text.indexOf("彩虹") >= 0 || text.indexOf("rainbow") >= 0) {
    pattern = "rainbow";
  } else if (text.indexOf("波浪") >= 0 || text.indexOf("wave") >= 0) {
    pattern = "wave";
  } else if (text.indexOf("清空") >= 0 || text.indexOf("clear") >= 0 || text.indexOf("off") >= 0) {
    pattern = "clear";
  }
  
  // 处理颜色命令
  if (text.indexOf("红色") >= 0 || text.indexOf("red") >= 0) {
    color[0] = 255;
    color[1] = 0;
    color[2] = 0;
  } else if (text.indexOf("绿色") >= 0 || text.indexOf("green") >= 0) {
    color[0] = 0;
    color[1] = 255;
    color[2] = 0;
  } else if (text.indexOf("蓝色") >= 0 || text.indexOf("blue") >= 0) {
    color[0] = 0;
    color[1] = 0;
    color[2] = 255;
  } else if (text.indexOf("黄色") >= 0 || text.indexOf("yellow") >= 0) {
    color[0] = 255;
    color[1] = 255;
    color[2] = 0;
  } else if (text.indexOf("紫色") >= 0 || text.indexOf("purple") >= 0) {
    color[0] = 128;
    color[1] = 0;
    color[2] = 128;
  } else if (text.indexOf("青色") >= 0 || text.indexOf("cyan") >= 0) {
    color[0] = 0;
    color[1] = 255;
    color[2] = 255;
  } else if (text.indexOf("白色") >= 0 || text.indexOf("white") >= 0) {
    color[0] = 255;
    color[1] = 255;
    color[2] = 255;
  }
  
  // 处理动画命令
  if (text.indexOf("渐变") >= 0 || text.indexOf("fade") >= 0) {
    animation = "fade";
  } else if (text.indexOf("闪烁") >= 0 || text.indexOf("blink") >= 0) {
    animation = "blink";
  }
  
  // 执行命令
  executeCommand(pattern, color, animation, speed);
  
  // 发送确认
  sendMessage("已执行命令: " + text);
}

// 检查是否为聊天消息
bool isChatMessage(String text) {
  // 常见的问候语和问题
  String chatKeywords[] = {"你好", "hello", "hi", "在吗", "在不在", "怎么样", "how are you", "好吗", "好", "好的", "是的", "ok", "okey", "thanks", "谢谢", "thank you"};
  
  for (int i = 0; i < sizeof(chatKeywords) / sizeof(chatKeywords[0]); i++) {
    if (text.indexOf(chatKeywords[i]) >= 0) {
      return true;
    }
  }
  return false;
}

// 处理聊天消息
void handleChatMessage(String text) {
  text.toLowerCase();
  
  if (text.indexOf("你好") >= 0 || text.indexOf("hello") >= 0 || text.indexOf("hi") >= 0) {
    sendMessage("你好！我是ESP32 RGB控制器，有什么可以帮你的吗？");
  } else if (text.indexOf("在吗") >= 0 || text.indexOf("在不在") >= 0) {
    sendMessage("我在呢！随时为你服务。");
  } else if (text.indexOf("怎么样") >= 0 || text.indexOf("how are you") >= 0 || text.indexOf("好吗") >= 0) {
    sendMessage("我很好，谢谢关心！你呢？");
  } else if (text.indexOf("好") >= 0 || text.indexOf("好的") >= 0 || text.indexOf("是的") >= 0 || text.indexOf("ok") >= 0 || text.indexOf("okey") >= 0) {
    sendMessage("好的，没问题！");
  } else if (text.indexOf("谢谢") >= 0 || text.indexOf("thanks") >= 0 || text.indexOf("thank you") >= 0) {
    sendMessage("不客气，很高兴能帮到你！");
  } else {
    sendMessage("我是ESP32 RGB控制器，你可以告诉我要显示什么图案或颜色，例如：红色爱心");
  }
}

// 执行命令
void executeCommand(String pattern, int color[3], String animation, int speed) {
  // 更新全局状态
  currentPattern = pattern;
  currentColor[0] = color[0];
  currentColor[1] = color[1];
  currentColor[2] = color[2];
  currentAnimation = animation;
  currentSpeed = speed;
  
  // 立即执行一次，确保状态更新
  executeCurrentAnimation();
}

// 绘制自定义图案
void drawCustomPattern() {
  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      int index = y * 8 + x;
      int r = customPixelColors[y][x][0];
      int g = customPixelColors[y][x][1];
      int b = customPixelColors[y][x][2];
      strip.setPixelColor(index, strip.Color(r, g, b));
    }
  }
  strip.show();
}

// 绘制图案
void drawPattern(byte pattern[8][8], int r, int g, int b) {
  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      int index = y * 8 + x;
      if (pattern[y][x] == 1) {
        strip.setPixelColor(index, strip.Color(r, g, b));
      } else {
        strip.setPixelColor(index, 0);
      }
    }
  }
  strip.show();
}

// 彩虹效果
void rainbowEffect() {
  for (int i = 0; i < LED_COUNT; i++) {
    strip.setPixelColor(i, Wheel((i * 256 / LED_COUNT) & 255));
  }
  strip.show();
}

// 波浪效果
void waveEffect(int r, int g, int b, int speed) {
  static int phase = 0;
  static unsigned long lastUpdate = 0;
  
  if (millis() - lastUpdate < 1000 / speed) {
    return;
  }
  lastUpdate = millis();
  
  clearMatrix();
  for (int x = 0; x < 8; x++) {
    int y = (x + phase) % 8;
    int index = y * 8 + x;
    strip.setPixelColor(index, strip.Color(r, g, b));
  }
  strip.show();
  
  phase = (phase + 1) % 8;
}

// 渐变动画
void fadeAnimation(int speed) {
  static int brightness = 0;
  static int direction = 1;
  
  for (int i = 0; i < LED_COUNT; i++) {
    uint32_t color = strip.getPixelColor(i);
    if (color > 0) {
      uint8_t r = (color >> 16) & 0xFF;
      uint8_t g = (color >> 8) & 0xFF;
      uint8_t b = color & 0xFF;
      
      strip.setPixelColor(i, strip.Color(
        r * brightness / 255,
        g * brightness / 255,
        b * brightness / 255
      ));
    }
  }
  strip.show();
  
  brightness += direction * speed;
  if (brightness <= 0) {
    brightness = 0;
    direction = 1;
  } else if (brightness >= 255) {
    brightness = 255;
    direction = -1;
  }
}

// 闪烁动画
void blinkAnimation(int speed) {
  static bool on = false;
  static unsigned long lastUpdate = 0;
  
  if (millis() - lastUpdate < 1000 / speed) {
    return;
  }
  lastUpdate = millis();
  
  if (on) {
    strip.setBrightness(100);
  } else {
    strip.setBrightness(0);
  }
  strip.show();
  
  on = !on;
}

// 呼吸动画
void breathAnimation(int speed) {
  static int brightness = 0;
  static int direction = 1;
  
  strip.setBrightness(brightness);
  strip.show();
  
  brightness += direction * speed;
  if (brightness <= 0) {
    brightness = 0;
    direction = 1;
  } else if (brightness >= 255) {
    brightness = 255;
    direction = -1;
  }
}

// 流水灯动画
void flowAnimation(int speed) {
  static int position = 0;
  static unsigned long lastUpdate = 0;
  
  if (millis() - lastUpdate < 1000 / speed) {
    return;
  }
  lastUpdate = millis();
  
  // 清空所有灯
  strip.clear();
  
  // 点亮当前位置的灯
  strip.setPixelColor(position, strip.Color(currentColor[0], currentColor[1], currentColor[2]));
  
  // 点亮前一个位置的灯（渐变效果）
  int prevPosition = (position - 1 + LED_COUNT) % LED_COUNT;
  strip.setPixelColor(prevPosition, strip.Color(currentColor[0]/2, currentColor[1]/2, currentColor[2]/2));
  
  strip.show();
  
  position = (position + 1) % LED_COUNT;
}

// 随机闪烁动画
void randomAnimation(int speed) {
  static unsigned long lastUpdate = 0;
  
  if (millis() - lastUpdate < 1000 / speed) {
    return;
  }
  lastUpdate = millis();
  
  // 收集当前灯板上的所有非零颜色
  int colors[64][3];
  int colorCount = 0;
  
  for (int i = 0; i < LED_COUNT; i++) {
    uint32_t color = strip.getPixelColor(i);
    if (color > 0) {
      int r = (color >> 16) & 0xFF;
      int g = (color >> 8) & 0xFF;
      int b = color & 0xFF;
      colors[colorCount][0] = r;
      colors[colorCount][1] = g;
      colors[colorCount][2] = b;
      colorCount++;
    }
  }
  
  // 如果没有非零颜色，使用当前颜色
  if (colorCount == 0) {
    colors[0][0] = currentColor[0];
    colors[0][1] = currentColor[1];
    colors[0][2] = currentColor[2];
    colorCount = 1;
  }
  
  // 随机选择3-5个灯进行闪烁
  int blinkCount = random(3, 6);
  int blinkingLeds[blinkCount];
  
  // 随机选择灯的索引
  for (int i = 0; i < blinkCount; i++) {
    blinkingLeds[i] = random(LED_COUNT);
  }
  
  // 点亮选中的灯
  for (int i = 0; i < blinkCount; i++) {
    int randomColorIndex = random(colorCount);
    int r = colors[randomColorIndex][0];
    int g = colors[randomColorIndex][1];
    int b = colors[randomColorIndex][2];
    strip.setPixelColor(blinkingLeds[i], strip.Color(r, g, b));
  }
  strip.show();
  
  // 短暂延迟后熄灭
  delay(100);
  for (int i = 0; i < blinkCount; i++) {
    strip.setPixelColor(blinkingLeds[i], 0);
  }
  strip.show();
}

// 清空矩阵
void clearMatrix() {
  strip.clear();
  strip.show();
}

// 彩虹颜色
uint32_t Wheel(byte WheelPos) {
  WheelPos = 255 - WheelPos;
  if(WheelPos < 85) {
    return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);
  }
  if(WheelPos < 170) {
    WheelPos -= 85;
    return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3);
  }
  WheelPos -= 170;
  return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);
}

// 发送消息
void sendMessage(String message) {
  if (deviceConnected && pCharacteristic) {
    pCharacteristic->setValue(message.c_str());
    pCharacteristic->notify();
  }
  Serial.println("发送: " + message);
}

// Base64解码函数 - 优化版本
String base64Decode(String encoded) {
  const char base64_chars[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  String decoded;
  int in_len = encoded.length();
  int i = 0, j = 0, in_ = 0;
  unsigned char char_array_4[4], char_array_3[3];
  
  // 预分配内存，减少字符串拼接开销
  decoded.reserve(in_len * 3 / 4);
  
  while (in_len-- && (encoded[in_] != '=') && isBase64(encoded[in_])) {
    char_array_4[i++] = encoded[in_]; in_++;
    if (i == 4) {
      // 快速查找Base64字符索引
      for (i = 0; i < 4; i++) {
        char c = char_array_4[i];
        if (c >= 'A' && c <= 'Z') char_array_4[i] = c - 'A';
        else if (c >= 'a' && c <= 'z') char_array_4[i] = c - 'a' + 26;
        else if (c >= '0' && c <= '9') char_array_4[i] = c - '0' + 52;
        else if (c == '+') char_array_4[i] = 62;
        else if (c == '/') char_array_4[i] = 63;
      }
      
      char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
      char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
      char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];
      
      for (i = 0; i < 3; i++) {
        decoded += (char)char_array_3[i];
      }
      i = 0;
    }
  }
  
  if (i) {
    for (j = i; j < 4; j++)
      char_array_4[j] = 0;
    
    // 快速查找Base64字符索引
    for (j = 0; j < 4; j++) {
      char c = char_array_4[j];
      if (c >= 'A' && c <= 'Z') char_array_4[j] = c - 'A';
      else if (c >= 'a' && c <= 'z') char_array_4[j] = c - 'a' + 26;
      else if (c >= '0' && c <= '9') char_array_4[j] = c - '0' + 52;
      else if (c == '+') char_array_4[j] = 62;
      else if (c == '/') char_array_4[j] = 63;
    }
    
    char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
    char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
    char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];
    
    for (j = 0; j < i - 1; j++) {
      decoded += (char)char_array_3[j];
    }
  }
  
  return decoded;
}

// 检查字符是否为有效的Base64字符
bool isBase64(unsigned char c) {
  return (isalnum(c) || (c == '+') || (c == '/'));
}
