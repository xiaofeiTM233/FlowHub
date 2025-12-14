// app/posts/edit/[id]/page.tsx
'use client';

// React 相关
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// 第三方库
import { App, Space, Flex, Form, Upload, Image } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProCard, ProForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-components';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';

// 内部组件
import itemRender from '@/components/itemRender';

/**
 * 帖子编辑页面组件
 * 用于编辑帖子的详细信息
 */
const PostEditPage: React.FC = () => {
  // 路由参数
  const params = useParams();
  const { id } = params;
  const { message } = App.useApp();

  // 状态管理
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

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
   * 格式化 Base64 图片数据
   * @param base64 - Base64 编码的图片数据
   * @returns 完整的 data URL
   */
  const formatBase64 = (base64: string) => {
    // 如果已经包含 http 前缀或 data: 前缀，直接返回
    if (base64.startsWith('http') || base64.startsWith('data:')) {
      return base64;
    }
    // 否则添加 base64 data 前缀
    return `data:image/jpeg;base64,${base64}`;
  };

  /**
   * 将文件转换为base64
   */
  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  /**
   * 处理图片变化
   */
  const handleImageChange: UploadProps['onChange'] = async ({ fileList: newFileList }) => {
    const processedFileList = await Promise.all(
      newFileList.map(async (file) => {
        if (file.originFileObj && !file.url) {
          try {
            const base64 = await getBase64(file.originFileObj as File);
            return {
              ...file,
              status: 'done' as const,
              url: base64,
              thumbUrl: base64,
            };
          } catch (error) {
            console.error('转换图片为base64失败:', error);
            return file;
          }
        }
        return file;
      })
    );
    setFileList(processedFileList);
  };

  /**
   * 获取帖子数据
   * 根据 ID 从 API 获取帖子详细信息
   */
  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      try {
        const response = await axios.get(`/api/posts?id=${id}`);
        if (response.data.code === 0) {
          const postData = response.data.data;
          setPost(postData);
          // 如果有图片数据，设置fileList
          if (postData.content?.images && Array.isArray(postData.content.images)) {
            const imageFileList = postData.content.images.map((img: string, index: number) => {
              const formattedImg = formatBase64(img);
              return {
                uid: `-${index}`,
                name: `image-${index + 1}`,
                status: 'done' as const,
                url: formattedImg,
                thumbUrl: formattedImg,
              };
            });
            setFileList(imageFileList);
          }
        } else {
          message.error(response.data.message || '获取帖子失败');
          router.back();
        }
      } catch (err: any) {
        message.error(err.message || '请求出错');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  /**
   * 处理表单提交
   * @param values - 表单数据
   */
  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      // 将图片数据添加到表单数据中
      const images = fileList
        .filter(file => file.status === 'done' && file.url)
        .map(file => file.url as string);
      const submitData = {
        data: {
          ...values,
          pid: id,
          content: {
            ...values.content,
            images: images
          }
        }
      };
      if (id !== 'new') delete submitData.data._id;
      delete submitData.data.timestamp;
      delete submitData.data.results;
      const response = await axios.post(`/api/posts`, submitData);
      if (response.data.code === 0) {
        message.success('保存成功');
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
    return <PageContainer loading />;
  }

  return (
    <PageContainer
      header={{
        title: '',
        breadcrumb: {
          items: [
            {
              path: '/posts/list',
              title: '帖子列表',
            },
            {
              title: id,
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
              帖子ID: {post._id}
              <span style={{ marginLeft: '8px', color: '#8c8c8c', fontSize: '12px', fontFamily: 'monospace' }}>
                ({post.timestamp})
              </span>
            </span>
            <span>
              发布于: {dayjs(post.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </span>
          </Flex>
        </ProCard>
        <ProCard>
          <ProForm
            form={form}
            initialValues={post}
            onReset={() => {
              form.resetFields();
            }}
            onFinish={handleSubmit}
            submitter={{
              searchConfig: {
                submitText: '保存',
              },
              submitButtonProps: {
                icon: <SaveOutlined />,
                loading: submitting,
              },
            }}
          >
            <ProFormText
              name="_id"
              label="pid"
              placeholder="请输入pid"
              rules={[{ required: true }]}
              disabled
            />
            <ProFormText
              name="cid"
              label="cid"
              placeholder="请输入cid"
              disabled
            />
            <ProFormText
              name="timestamp"
              label="时间戳"
              rules={[{ required: true }]}
              disabled
            />
            <ProFormSelect
              name="type"
              label="状态"
              options={[
                { label: '草稿', value: 'draft' },
                { label: '已发布', value: 'published' },
                { label: '已删帖', value: 'deleted' },
              ]}
              rules={[{ required: true, message: '请选择帖子状态' }]}
            />
            <ProFormSelect
              name={['sender', 'source']}
              label="来源"
              placeholder="请输入内容来源"
              disabled
              options={[
                { label: '审核', value: 'review' },
                { label: '人工', value: 'manual' },
              ]}
              rules={[{ required: true, message: '请选择内容来源' }]}
            />
            <ProFormSelect
              name={['sender', 'platform']}
              label="发布平台"
              mode="tags"
              options={post.sender.platform.map((i: string) => ({ label: i, value: i }))}
              placeholder="请选择发布平台"
            />
            <ProFormText
              name={['content', 'title']}
              label="标题"
              placeholder="请输入帖子标题"
              fieldProps={{
                maxLength: 100,
                showCount: true,
              }}
            />
            <ProFormTextArea
              name={['content', 'text']}
              label="文本内容"
              placeholder="请输入帖子文本内容"
              fieldProps={{
                rows: 6,
                maxLength: 2000,
                showCount: true,
              }}
            />
            <Form.Item label="图片">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={handleImageChange}
                onPreview={(file) => {
                  // 找到当前图片在预览组中的索引
                  const validFiles = fileList.filter(f => f.status === 'done' && f.url);
                  const currentIndex = validFiles.findIndex(f => f.uid === file.uid);
                  // 触发图片预览
                  const imageElements = document.querySelectorAll('.ant-image-preview-group .ant-image');
                  if (imageElements[currentIndex]) {
                    (imageElements[currentIndex] as HTMLElement).click();
                  }
                }}
                beforeUpload={() => false} // 阻止自动上传
                maxCount={8}
                accept="image/*"
              >
                {fileList.length >= 8 ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>上传图片</div>
                  </div>
                )}
              </Upload>
              <div style={{ display: 'none' }} className="ant-image-preview-group">
                <Image.PreviewGroup>
                  {fileList
                    .filter(file => file.status === 'done' && file.url)
                    .map((file) => (
                      <Image
                        key={file.uid}
                        src={file.url}
                        alt={file.name}
                      />
                    ))}
                </Image.PreviewGroup>
              </div>
            </Form.Item>
          </ProForm>
        </ProCard>
      </Space>
    </PageContainer>
  );
};

export default PostEditPage;
