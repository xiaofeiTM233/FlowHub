// components/JsonEditor.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button, message, Space, Spin } from 'antd';

interface JsonEditorProps {
  initialValue: object; // 接收一个 JSON 对象作为初始值
  onSave: (updatedJson: object) => Promise<boolean>; // 保存回调，返回 Promise<boolean> 表示是否成功
}

const JsonEditor: React.FC<JsonEditorProps> = ({ initialValue, onSave }) => {
  // 使用 state 存储可编辑的 JSON 字符串
  const [jsonString, setJsonString] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 当 initialValue 变化时 (例如，父组件数据刷新)，更新编辑器的内容
  useEffect(() => {
    // 将传入的 JSON 对象格式化为漂亮的字符串
    setJsonString(JSON.stringify(initialValue, null, 2));
  }, [initialValue]);

  const handleSave = async () => {
    let parsedJson;
    try {
      // 1. 尝试解析当前编辑器中的字符串，检查是否为合法的 JSON
      parsedJson = JSON.parse(jsonString);
    } catch (error) {
      message.error('JSON 格式错误，请检查！');
      return;
    }
    
    setIsSaving(true);
    // 2. 调用父组件传入的 onSave 函数，并将解析后的 JSON 对象传回去
    const success = await onSave(parsedJson);
    if (success) {
      // 如果父组件告知保存成功，美化一下当前编辑器的内容
      setJsonString(JSON.stringify(parsedJson, null, 2));
    }
    setIsSaving(false);
  };

  return (
    <div>
      <div style={{ border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
        <Editor
          height="450px" // 编辑器高度
          language="json"
          theme="vs-dark" // 主题，'vs-dark' 或 'light'
          value={jsonString}
          onChange={(value) => setJsonString(value || '')}
          options={{
            minimap: { enabled: false }, // 不显示小地图
            scrollBeyondLastLine: false,
          }}
          loading={<Spin />}
        />
      </div>
      <Space style={{ marginTop: 16 }}>
        <Button type="primary" onClick={handleSave} loading={isSaving}>
          保存更改
        </Button>
      </Space>
    </div>
  );
};

export default JsonEditor;
