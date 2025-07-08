export function StreamRequest(data)  {
    return new Promise((resolve, reject) => {
        const response = uni.request({
            url: 'https://api.deepseek.com/chat/completions', // 请求地址
            method: "POST", // 你的请求方法
            data: data,
            header: {
                'Content-Type': 'application/json', // 声明接受事件流
                'Authorization': "Bearer sk-0c7eb8f261ab42f9b8fb5ecfa8e5bcf8"
            },
            responseType: "text",
            enableChunked: true, // 开启流传输
            success: (res) => {
                resolve(res)
            },
            fail: (err) => {
                reject(err)
            },
        })

        // 返回请求的响应
        resolve(response)
    })
}



export function decodeUTF8(data) {
    // 将二进制数据转为Uint8数组
    const uint8Array = new Uint8Array(data);
    
    // 传统方式转换字符串（兼容旧环境）
    let string = '';
    for (let i = 0; i < uint8Array.length; i++) {
        string += String.fromCharCode(uint8Array[i]);
    }
    
    // 双重解码处理特殊字符（如中文）
    return decodeURIComponent(escape(string));
}
