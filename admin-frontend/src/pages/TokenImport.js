import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Alert, Space, Typography, Divider } from 'antd';
import { ImportOutlined, SaveOutlined } from '@ant-design/icons';
import request from '../utils/request';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

const TokenImport = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleImport = async (values) => {
    setLoading(true);
    try {
      const response = await request.post('/account/import-token', values);
      if (response.success) {
        message.success('Token已保存，等待处理');
        form.resetFields();
      }
    } catch (error) {
      console.error('Import token error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Token导入</h2>
      </div>

      <Alert
        message="功能说明"
        description="此功能用于通过Token导入WindSurf账号信息。输入有效的Token后，系统将自动解析并存储账号信息。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Title level={4}>导入Token</Title>
        <Paragraph type="secondary">
          请在下方输入WindSurf账号的Token信息，系统将自动解析并提取账号邮箱、名称和API Key。
        </Paragraph>
        
        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleImport}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="Token"
            name="token"
            rules={[{ required: true, message: '请输入Token' }]}
            extra="请确保Token的有效性和完整性"
          >
            <TextArea 
              rows={10} 
              placeholder="在此粘贴WindSurf Token..."
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
              >
                保存Token
              </Button>
              <Button 
                onClick={() => form.resetFields()}
                size="large"
              >
                清空
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Divider />

        <Alert
          message="注意事项"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>Token必须是有效的WindSurf账号Token</li>
              <li>系统将自动提取账号邮箱、名称和API Key</li>
              <li>导入的账号将自动添加到账号池中</li>
              <li>重复的账号将被自动跳过</li>
              <li>此功能目前为预留功能，具体解析逻辑待实现</li>
            </ul>
          }
          type="warning"
          showIcon
        />
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Title level={4}>Token格式示例</Title>
        <Paragraph>
          <Text code style={{ display: 'block', padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
            {`{
  "email": "user@example.com",
  "name": "User Name",
  "apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxx",
  ...其他字段
}`}
          </Text>
        </Paragraph>
        <Paragraph type="secondary">
          Token应包含以上必要字段，系统会自动解析并提取所需信息。
        </Paragraph>
      </Card>
    </div>
  );
};

export default TokenImport;
