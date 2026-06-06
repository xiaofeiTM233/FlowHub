// app/dashboard/options/page.tsx
'use client';

// React 相关
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// 第三方库
import { Alert, App, Col, Flex, Form, Row, Space, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { PageContainer, ProCard, ProForm, ProFormText, ProFormSelect, ProFormSwitch, ProFormDigit } from '@ant-design/pro-components';
import axios from 'axios';
import { useSession } from 'next-auth/react';

// 内部组件
import itemRender from '@/components/itemRender';

const { Text } = Typography;

/** storage_platforms 数组 → 扁平表单字段 */
function platformsToFlat(platforms: any[]): Record<string, any> {
  const flat: Record<string, any> = {};
  const vercel = platforms.find((p: any) => p.type === 'vercel') || {};
  const r2 = platforms.find((p: any) => p.type === 'r2') || {};
  const webdav = platforms.find((p: any) => p.type === 'webdav') || {};

  flat._storage_vercel_token = vercel.token || '';
  flat._storage_vercel_name = vercel.name || '';

  flat._storage_r2_access_key_id = r2.access_key_id || '';
  flat._storage_r2_secret_access_key = r2.secret_access_key || '';
  flat._storage_r2_endpoint = r2.endpoint || '';
  flat._storage_r2_bucket = r2.bucket || '';
  flat._storage_r2_public_url = r2.public_url || '';
  flat._storage_r2_name = r2.name || '';

  flat._storage_webdav_url = webdav.url || '';
  flat._storage_webdav_user = webdav.user || '';
  flat._storage_webdav_pass = webdav.pass || '';
  flat._storage_webdav_base_path = webdav.base_path || '/flowhub/';
  flat._storage_webdav_name = webdav.name || '';

  return flat;
}

/** 扁平表单字段 → storage_platforms 数组 */
function flatToPlatforms(formValues: Record<string, any>): any[] {
  const platforms: any[] = [];

  if (formValues._storage_vercel_token) {
    platforms.push({
      type: 'vercel',
      name: formValues._storage_vercel_name || 'Vercel',
      token: formValues._storage_vercel_token
    });
  }
  if (formValues._storage_r2_access_key_id) {
    platforms.push({
      type: 'r2',
      name: formValues._storage_r2_name || 'R2',
      access_key_id: formValues._storage_r2_access_key_id,
      secret_access_key: formValues._storage_r2_secret_access_key || '',
      endpoint: formValues._storage_r2_endpoint || '',
      bucket: formValues._storage_r2_bucket || '',
      public_url: formValues._storage_r2_public_url || ''
    });
  }
  if (formValues._storage_webdav_url) {
    platforms.push({
      type: 'webdav',
      name: formValues._storage_webdav_name || 'WebDAV',
      url: formValues._storage_webdav_url,
      user: formValues._storage_webdav_user || '',
      pass: formValues._storage_webdav_pass || '',
      base_path: formValues._storage_webdav_base_path || '/flowhub/'
    });
  }
  // base64 是内置默认，不需要出现在数组中
  return platforms;
}

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
        const response = await axios.get('/api/settings/options');
        if (response.data.code === 0) {
          const optionsData = response.data.data;
          // 从 storage_platforms 数组解析为扁平字段
          const flatFields = platformsToFlat(optionsData.storage_platforms || []);
          const merged = { ...optionsData, ...flatFields };
          setOptions(merged);
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
      // 分离扁平存储字段，构建 storage_platforms 数组
      const data: any = {};
      for (const [key, val] of Object.entries(values)) {
        if (key.startsWith('_storage_')) continue;
        data[key] = val;
      }
      data.storage_platforms = flatToPlatforms(values);

      const submitData = { data };
      const response = await axios.post('/api/settings/options', submitData);
      if (response.data.code === 0) {
        message.success('设置保存成功');
        setOptions(values);
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
              title: '系统管理'
            },
            {
              path: '/settings/options',
              title: '系统设置',
            },
          ],
          itemRender
        }
      }}
    />;
  }

  const isSysop = session?.user?.role === 'sysop';

  // default_storage_platform 下拉选项：base64 始终可选 + 数组中已配置的平台
  const platformOptions = [
    { label: 'Base64（默认）', value: 'base64' },
    ...(options.storage_platforms || []).map((p: any) => ({ label: p.name || p.type, value: p.name }))
  ];

  return (
    <PageContainer
      header={{
        title: '',
        breadcrumb: {
          items: [
            {
              title: '系统管理'
            },
            {
              path: '/settings/options',
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
            submitter={isSysop ? {
              searchConfig: {
                submitText: '保存设置',
              },
              submitButtonProps: {
                icon: <SaveOutlined />,
                loading: submitting,
              },
            } : false}
            disabled={!isSysop}
          >
            {/* ===== 基本设置 ===== */}
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

        {/* ===== 附件存储设置 ===== */}
        <ProCard title="附件存储">
          <ProForm
            form={form}
            initialValues={options}
            onReset={() => {
              form.resetFields();
            }}
            onFinish={handleSubmit}
            submitter={isSysop ? {
              searchConfig: {
                submitText: '保存设置',
              },
              submitButtonProps: {
                icon: <SaveOutlined />,
                loading: submitting,
              },
            } : false}
            disabled={!isSysop}
          >
            <ProFormSelect
              name="default_storage_platform"
              label="默认存储平台"
              placeholder="请选择默认附件存储方式"
              options={platformOptions}
              rules={[{ required: true, message: '请选择默认存储平台' }]}
              extra="上传附件时使用的存储平台，可同时配置多个平台的凭证"
            />

            {/* Vercel Blob 配置 */}
            <ProCard
              size="small"
              title="Vercel Blob 配置"
              type="inner"
              style={{ marginTop: 16 }}
            extra={<Text type="secondary">获取 Token：Vercel Dashboard → Storage → Blob → Create Token</Text>}
          >
            <ProFormText
              name="_storage_vercel_name"
              label="平台备注"
              placeholder="如：主号 Blob"
              initialValue="Vercel"
            />
              <ProFormText.Password
                name="_storage_vercel_token"
                label="BLOB_READ_WRITE_TOKEN"
                placeholder="vercel_blob_xxx..."
              />
            </ProCard>

            {/* R2 配置 */}
            <ProCard
              size="small"
              title="Cloudflare R2 配置"
              type="inner"
              style={{ marginTop: 16 }}
                extra={<Text type="secondary">获取凭证：Cloudflare Dashboard → R2 → Manage API Tokens</Text>}
              >
                <ProFormText
                  name="_storage_r2_name"
                  label="平台备注"
                  placeholder="如：个人桶"
                  initialValue="R2"
                />
              <Row gutter={16}>
                <Col span={12}>
                  <ProFormText
                    name="_storage_r2_access_key_id"
                    label="Access Key ID"
                    placeholder="输入 R2 Access Key ID"
                  />
                </Col>
                <Col span={12}>
                  <ProFormText.Password
                    name="_storage_r2_secret_access_key"
                    label="Secret Access Key"
                    placeholder="输入 R2 Secret Access Key"
                  />
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <ProFormText
                    name="_storage_r2_endpoint"
                    label="Endpoint"
                    placeholder="https://<account>.r2.cloudflarestorage.com"
                  />
                </Col>
                <Col span={12}>
                  <ProFormText
                    name="_storage_r2_bucket"
                    label="存储桶名称"
                    placeholder="输入 R2 Bucket 名称"
                  />
                </Col>
              </Row>
              <ProFormText
                name="_storage_r2_public_url"
                label="公开访问 URL（可选）"
                placeholder="https://your-domain.com 或留空"
                extra="绑定自定义域名后填写，留空则使用 R2 原生 endpoint"
              />
            </ProCard>

            {/* WebDAV 配置 */}
            <ProCard
              size="small"
              title="WebDAV 配置"
              type="inner"
              style={{ marginTop: 16 }}
                extra={<Text type="secondary">支持坚果云、阿里云盘、NextCloud 等任意 WebDAV 服务</Text>}
              >
                <ProFormText
                  name="_storage_webdav_name"
                  label="平台备注"
                  placeholder="如：坚果云主号"
                  initialValue="WebDAV"
                />
              <ProFormText
                name="_storage_webdav_url"
                label="WebDAV 地址"
                placeholder="https://dav.jianguoyun.com/dav/"
              />
              <Row gutter={16}>
                <Col span={12}>
                  <ProFormText
                    name="_storage_webdav_user"
                    label="用户名"
                    placeholder="输入 WebDAV 用户名"
                  />
                </Col>
                <Col span={12}>
                  <ProFormText.Password
                    name="_storage_webdav_pass"
                    label="密码 / 应用密码"
                    placeholder="输入密码"
                  />
                </Col>
              </Row>
              <ProFormText
                name="_storage_webdav_base_path"
                label="存储根路径（可选）"
                placeholder="/flowhub/"
                initialValue="/flowhub/"
              />
            </ProCard>

            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
              message="切换默认存储平台后，已存在的附件不会自动迁移"
              description="可同时配置多个平台凭证，通过更换默认平台来切换。如果已有附件需要迁移，需编写数据迁移脚本。"
            />
          </ProForm>
        </ProCard>
      </Space>
    </PageContainer>
  );
};

export default OptionsEditPage;
