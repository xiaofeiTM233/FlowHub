// app/dashboard/options/page.tsx
'use client';

// React 相关
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// 第三方库
import { Alert, App, Col, Flex, Form, Row, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { PageContainer, ProCard, ProForm, ProFormText, ProFormSelect, ProFormSwitch, ProFormDigit } from '@ant-design/pro-components';
import axios from 'axios';
import { useSession } from 'next-auth/react';

// 内部组件
import itemRender from '@/components/itemRender';

/**
 * 设置编辑页面组件
 * 用于编辑系统设置
 */
const OptionsEditPage: React.FC = () => {
  const { message } = App.useApp();

  // 状态管理
  const [options, setOptions] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 路由对象
  const router = useRouter();
  
  const [form] = Form.useForm();

  // 获取用户会话信息
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      message.warning('请先登录');
      router.push('/dashboard/login');
    },
  }) as { data: any, status: string };

  /**
   * 获取设置数据
   * 从 API 获取系统设置信息
   */
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await axios.get('/api/options');
        if (response.data.code === 0) {
          const optionsData = response.data.data;
          setOptions(optionsData);
        } else {
          message.error(response.data.message || '获取设置失败');
          router.back();
        }
      } catch (err: any) {
        message.error(err.message || '请求出错');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  /**
   * 处理表单提交
   * @param values - 表单数据
   */
  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const submitData = {
        data: {
          ...values
        }
      };
      
      const response = await axios.post('/api/options', submitData);
      if (response.data.code === 0) {
        message.success('设置保存成功');
        setOptions({ ...options, ...values });
      } else {
        message.error(response.data.message || '保存失败');
      }
    } catch (err: any) {
      message.error(err.message || '请求出错');
    } finally {
      setSubmitting(false);
    }
  };

  // 加载状态处理
  if (loading) {
    return <PageContainer
      loading
      header={{
        title: '',
        breadcrumb: {
          items: [
            {
              path: '/dashboard/index',
              title: '仪表盘',
            },
            {
              title: '系统设置',
            },
          ],
          itemRender
        }
      }}
    />;
  }

  return (
    <PageContainer
      header={{
        title: '',
        breadcrumb: {
          items: [
            {
              path: '/dashboard/index',
              title: '仪表盘',
            },
            {
              title: '系统设置',
            },
          ],
          itemRender
        }
      }}
    >
      <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
        <ProCard>
          <Flex justify="space-between" align="center" style={{ minHeight: 32 }}>
            <span>
              设置ID: {options._id}
            </span>
          </Flex>
        </ProCard>
        
        <ProCard>
          <ProForm
            form={form}
            initialValues={options}
            onReset={() => {
              form.resetFields();
            }}
            onFinish={handleSubmit}
            submitter={session?.user?.role === 'sysop' ? {
              searchConfig: {
                submitText: '保存设置',
              },
              submitButtonProps: {
                icon: <SaveOutlined />,
                loading: submitting,
              },
            } : false}
            disabled={session?.user?.role !== 'sysop'}
          >
            <ProFormText
              name="description"
              label="系统描述"
              placeholder="请输入系统描述"
              fieldProps={{
                maxLength: 100,
                showCount: true,
              }}
              rules={[{ required: true, message: '请输入系统描述' }]}
            />
            <Row gutter={16}>
              <Col span={12}>
                <ProFormSelect
                  name="default_platform"
                  label="默认发布平台"
                  mode="tags"
                  placeholder="请选择默认发布平台"
                  rules={[{ required: true, message: '请选择至少一个默认平台' }]}
                />
              </Col>
              <Col span={12}>
                <ProFormSelect
                  name="review_push_platform"
                  label="审核推送平台(OneBot)"
                  placeholder="请选择审核推送平台"
                  rules={[{ required: true, message: '请选择审核推送平台' }]}
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <ProFormDigit
                  name="last_number"
                  label="最后稿件编号"
                  placeholder="最后生成的稿件编号"
                  min={0}
                  fieldProps={{
                    style: { width: '100%' }
                  }}
                  rules={[{ required: true, message: '请输入最后稿件编号' }]}
                />
              </Col>
              <Col span={12}>
                <ProFormText
                  name="review_push_group"
                  label="审核推送群号(OneBot)"
                  placeholder="请输入审核推送群号"
                  fieldProps={{
                    style: { width: '100%' }
                  }}
                  rules={[{ required: true, message: '请输入审核推送群号' }]}
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <ProFormSwitch
                  name="review_push_direct"
                  label="直接(图文)审核推送"
                  extra="关闭则启用合并转发推送(实验性)，建议保持开启"
                />
              </Col>
              <Col span={12}>
                <ProFormSwitch
                  name="publish_direct"
                  label="直接发布"
                  extra="开启后，稿件满足审核条件后将自动发布而非暂存草稿箱"
                />
              </Col>
            </Row>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <ProFormDigit
                  name="approve_num"
                  label="批准票数要求"
                  placeholder="请输入批准所需的票数"
                  min={1}
                  fieldProps={{
                    style: { width: '100%' }
                  }}
                  rules={[{ required: true, message: '请输入批准票数' }]}
                />
                <ProFormDigit
                  name="reject_num"
                  label="拒绝票数要求"
                  placeholder="请输入拒绝所需的票数"
                  min={1}
                  fieldProps={{
                    style: { width: '100%' }
                  }}
                  rules={[{ required: true, message: '请输入拒绝票数' }]}
                />
                <ProFormDigit
                  name="total_num"
                  label="净票数要求"
                  placeholder="请输入净票数要求"
                  min={0}
                  fieldProps={{
                    style: { width: '100%' }
                  }}
                  rules={[{ required: true, message: '请输入净票数要求' }]}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Alert
                  title="票数要求说明"
                  description={
                    <div style={{ lineHeight: '1.5' }}>
                      <div><b>批准票数要求：</b>当投批准票的数量达到此数值时，稿件将被通过。</div>
                      <div><b>拒绝票数要求：</b>当投拒绝票的数量达到此数值时，稿件将被拒绝。</div>
                      <div><b>净票数要求①：</b>当（赞成票 - 反对票）的净票数达到此数值时，稿件将被通过。</div>
                      <div><b>净票数要求②：</b>当（反对票 - 赞成票）的净票数达到此数值时，稿件将被拒绝。</div>
                      <div style={{ marginTop: '8px', color: '#666' }}>
                        注：上述条件中满足任意一个即可触发相应的审核结果（通过或拒绝），设置为 <b>0</b> 则不启用该条件。
                      </div>
                    </div>
                  }
                  type="info"
                  showIcon
                />
                <Alert
                  title="仅系统管理员可编辑设置"
                  banner
                  showIcon
                  style={{ marginTop: 12 }}
                />
              </div>
            </div>
          </ProForm>
        </ProCard>
      </Space>
    </PageContainer>
  );
};

export default OptionsEditPage;