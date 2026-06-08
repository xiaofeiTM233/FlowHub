// app/dashboard/options/page.tsx
'use client';

// React 相关
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

// 第三方库
import { Alert, App, Button, Col, Flex, Form, Input, Row, Select, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { PageContainer, ProCard, ProForm, ProFormText, ProFormSelect, ProFormSwitch, ProFormDigit } from '@ant-design/pro-components';
import axios from 'axios';
import { useSession } from 'next-auth/react';

// 内部组件
import itemRender from '@/components/itemRender';

const { Text } = Typography;

// ===== 存储类型配置（数据驱动） =====

interface StorageFieldDef {
  key: string;
  label: string;
  placeholder: string;
  password?: boolean;
  required?: boolean;
  extra?: string;
}

interface StorageTypeMeta {
  label: string;
  extra?: string;
  fields: StorageFieldDef[];
}

/** 可选的存储类型下拉项 */
const STORAGE_TYPE_OPTIONS = [
  { label: 'Vercel Blob', value: 'vercel' },
  { label: 'Cloudflare R2', value: 'r2' },
  { label: 'WebDAV', value: 'webdav' },
];

/** 每种存储类型对应的字段定义，新增平台只需在此追加 */
const STORAGE_TYPE_META: Record<string, StorageTypeMeta> = {
  vercel: {
    label: 'Vercel Blob',
    fields: [
      { key: 'token', label: 'BLOB_READ_WRITE_TOKEN', placeholder: 'vercel_blob_xxx...', password: true, required: true },
    ],
  },
  r2: {
    label: 'Cloudflare R2',
    fields: [
      { key: 'access_key_id', label: 'Access Key ID', placeholder: '输入 R2 Access Key ID', required: true },
      { key: 'secret_access_key', label: 'Secret Access Key', placeholder: '输入 R2 Secret Access Key', password: true },
      { key: 'endpoint', label: 'Endpoint', placeholder: 'https://<account>.r2.cloudflarestorage.com', required: true },
      { key: 'bucket', label: '存储桶名称', placeholder: '输入 R2 Bucket 名称', required: true },
      { key: 'public_url', label: '公开访问 URL（可选）', placeholder: 'https://your-domain.com 或留空', extra: '绑定自定义域名后填写，留空则使用 R2 原生 endpoint' },
    ],
  },
  webdav: {
    label: 'WebDAV',
    fields: [
      { key: 'url', label: 'WebDAV 地址', placeholder: 'https://dav.jianguoyun.com/dav/', required: true },
      { key: 'user', label: '用户名', placeholder: '输入 WebDAV 用户名', required: true },
      { key: 'pass', label: '密码 / 应用密码', placeholder: '输入密码', password: true, required: true },
      { key: 'base_path', label: '存储根路径（可选）', placeholder: '/flowhub/' },
    ],
  },
};

// ===== 单个存储配置条目子组件 =====

interface StoragePlatformEntryProps {
  name: number;
  restField: Record<string, any>;
  onRemove: () => void;
}

const StoragePlatformEntry: React.FC<StoragePlatformEntryProps> = ({ name, restField, onRemove }) => {
  const form = Form.useFormInstance();
  // 监听当前条目的类型字段，切换时重新渲染
  const entryType: string | undefined = Form.useWatch(['storage_platforms', name, 'type'], form);
  const meta = entryType ? STORAGE_TYPE_META[entryType] : undefined;

  /**
   * 切换存储类型时，清空当前条目已有的特定字段值，
   * 避免 vercel 的 token 出现在 r2 的数据中。
   */
  const handleTypeChange = () => {
    const resetValues: Record<string, undefined> = {};
    // 遍历全部类型的全部字段，统一置空
    Object.values(STORAGE_TYPE_META).forEach((m) => {
      m.fields.forEach((f) => { resetValues[f.key] = undefined; });
    });
    form.setFieldsValue({
      storage_platforms: { [name]: resetValues },
    });
  };

  return (
    <ProCard
      size="small"
      type="inner"
      title={meta?.label || '新存储配置'}
      extra={
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={onRemove}
          disabled={form?.getFieldValue('disabled')}
        />
      }
      style={{ marginBottom: 16 }}
    >
      {/* 存储类型选择 */}
      <Form.Item
        {...restField}
        name={[name, 'type']}
        label="存储类型"
        rules={[{ required: true, message: '请选择存储类型' }]}
      >
        <Select
          options={STORAGE_TYPE_OPTIONS}
          placeholder="选择存储类型"
          onChange={handleTypeChange}
          disabled={form?.getFieldValue('disabled')}
        />
      </Form.Item>

      {/* 平台备注 */}
      <Form.Item
        {...restField}
        name={[name, 'name']}
        label="平台备注"
        rules={[{ required: true, message: '请输入平台备注' }]}
      >
        <Input disabled={form?.getFieldValue('disabled')} />
      </Form.Item>

      {/* 类型决定的条件字段 */}
      {meta && (
        <>
          {meta.extra && (
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              {meta.extra}
            </Text>
          )}

          {meta.fields.length <= 2 ? (
            // 1~2 个字段：垂直排列
            meta.fields.map((def) => (
              <Form.Item
                key={def.key}
                {...restField}
                name={[name, def.key]}
                label={def.label}
                rules={def.required ? [{ required: true, message: `请输入${def.label}` }] : []}
                extra={def.extra}
              >
                {def.password
                  ? <Input.Password placeholder={def.placeholder} disabled={form?.getFieldValue('disabled')} />
                  : <Input placeholder={def.placeholder} disabled={form?.getFieldValue('disabled')} />
                }
              </Form.Item>
            ))
          ) : (
            // 3+ 个字段：两列网格，单行备注字段占整行
            <Row gutter={16}>
              {meta.fields.map((def) => {
                const isFullWidth = def.key === 'public_url' || def.key === 'base_path';
                return (
                  <Col span={isFullWidth ? 24 : 12} key={def.key}>
                    <Form.Item
                      {...restField}
                      name={[name, def.key]}
                      label={def.label}
                      rules={def.required ? [{ required: true, message: `请输入${def.label}` }] : []}
                      extra={def.extra}
                    >
                      {def.password
                        ? <Input.Password placeholder={def.placeholder} disabled={form?.getFieldValue('disabled')} />
                        : <Input placeholder={def.placeholder} disabled={form?.getFieldValue('disabled')} />
                      }
                    </Form.Item>
                  </Col>
                );
              })}
            </Row>
          )}
        </>
      )}
    </ProCard>
  );
};

// ===== 主页面组件 =====

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
  }) as { data: any; status: string };

  /**
   * 获取设置数据
   */
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await axios.get('/api/settings/options');
        if (response.data.code === 0) {
          const optionsData = response.data.data;
          // storage_platforms 本身就是数组，直接作为表单初始值
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
   */
  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      // 表单中 storage_platforms 已经是数组，直接提交
      const submitData = { data: values };
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

  // Form.useWatch / useMemo 必须在条件返回之前调用，确保 Hook 数量跨渲染一致
  // 加载阶段 Form 尚未挂载，watchedPlatforms 通过 fallback 退回到空数组
  const watchedPlatforms: any[] = Form.useWatch('storage_platforms', form) || [];

  const platformOptions = useMemo(() => {
    const source = Array.isArray(watchedPlatforms) && watchedPlatforms.length > 0
      ? watchedPlatforms
      : options?.storage_platforms || [];
    const configured = (Array.isArray(source) ? source : [])
      .filter((p: any) => p?.name)
      .map((p: any) => ({ label: p.name, value: p.name }));
    return [{ label: 'Base64（默认）', value: 'base64' }, ...configured];
  }, [watchedPlatforms, options]);

  // 加载状态处理
  if (loading) {
    return (
      <PageContainer
        loading
        header={{
          title: '',
          breadcrumb: {
            items: [
              { title: '系统管理' },
              { path: '/settings/options', title: '系统设置' },
            ],
            itemRender,
          },
        }}
      />
    );
  }

  const isSysop = session?.user?.role === 'sysop';

  const submitterConfig = isSysop
    ? {
        searchConfig: { submitText: '保存设置' },
        submitButtonProps: { icon: <SaveOutlined />, loading: submitting },
      }
    : false;

  return (
    <PageContainer
      header={{
        title: '',
        breadcrumb: {
          items: [
            { title: '系统管理' },
            { path: '/settings/options', title: '系统设置' },
          ],
          itemRender,
        },
      }}
    >
      <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
        <ProCard>
          <Flex justify="space-between" align="center" style={{ minHeight: 32 }}>
            <span>设置ID: {options._id}</span>
          </Flex>
        </ProCard>

        {/* ===== 基本设置 ===== */}
        <ProCard>
          <ProForm
            form={form}
            initialValues={options}
            onReset={() => form.resetFields()}
            onFinish={handleSubmit}
            submitter={submitterConfig}
            disabled={!isSysop}
          >
            <ProFormText
              name="description"
              label="系统描述"
              placeholder="请输入系统描述"
              fieldProps={{ maxLength: 100, showCount: true }}
              rules={[{ required: true, message: '请输入系统描述' }]}
            />
            <Row gutter={16}>
              <Col span={12}>
                <ProFormSelect
                  name="default_platform"
                  label="默认发布平台"
                  mode="tags"
                  placeholder="请选择默认发布平台"
                />
              </Col>
              <Col span={12}>
                <ProFormSelect
                  name="review_push_platform"
                  label="审核推送平台(OneBot)"
                  placeholder="请选择审核推送平台"
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
                  fieldProps={{ style: { width: '100%' } }}
                  rules={[{ required: true, message: '请输入最后稿件编号' }]}
                />
              </Col>
              <Col span={12}>
                <ProFormText
                  name="review_push_group"
                  label="审核推送群号(OneBot)"
                  placeholder="请输入审核推送群号"
                  fieldProps={{ style: { width: '100%' } }}
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
                  fieldProps={{ style: { width: '100%' } }}
                  rules={[{ required: true, message: '请输入批准票数' }]}
                />
                <ProFormDigit
                  name="reject_num"
                  label="拒绝票数要求"
                  placeholder="请输入拒绝所需的票数"
                  min={1}
                  fieldProps={{ style: { width: '100%' } }}
                  rules={[{ required: true, message: '请输入拒绝票数' }]}
                />
                <ProFormDigit
                  name="total_num"
                  label="净票数要求"
                  placeholder="请输入净票数要求"
                  min={0}
                  fieldProps={{ style: { width: '100%' } }}
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

        {/* ===== 附件存储设置（仅 sysop 可查看/编辑） ===== */}
        {isSysop && (
        <ProCard title="附件存储">
          <Form
            form={form}
            initialValues={options}
            onFinish={handleSubmit}
            disabled={!isSysop}
            layout="vertical"
          >
            {/* 默认存储平台选择器 */}
            <ProFormSelect
              name="default_storage_platform"
              label="默认存储平台"
              placeholder="请选择默认附件存储方式"
              options={platformOptions}
              rules={[{ required: true, message: '请选择默认存储平台' }]}
              extra="上传附件时使用的存储平台，可同时配置多个平台的凭证"
            />

            {/* 动态存储平台列表 */}
            <Form.List name="storage_platforms">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <StoragePlatformEntry
                      key={key}
                      name={name}
                      restField={restField}
                      onRemove={() => remove(name)}
                    />
                  ))}

                  {/* 添加按钮 */}
                  <Button
                    type="dashed"
                    onClick={() => add({ type: 'vercel', name: '' })}
                    block
                    icon={<PlusOutlined />}
                    style={{ marginBottom: 16 }}
                    disabled={!isSysop}
                  >
                    添加存储配置
                  </Button>
                </>
              )}
            </Form.List>

            {/* 保存按钮 */}
            {isSysop && (
              <Form.Item style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={submitting}
                >
                  保存设置
                </Button>
              </Form.Item>
            )}

            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
              title="切换默认存储平台后，已存在的附件不会自动迁移"
              description="可同时配置多个平台凭证，通过更换默认平台来切换。如果已有附件需要迁移，需编写数据迁移脚本。"
            />
          </Form>
        </ProCard>
        )}
      </Space>
    </PageContainer>
  );
};

export default OptionsEditPage;
