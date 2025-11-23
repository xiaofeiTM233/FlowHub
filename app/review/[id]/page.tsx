// app/review/[id]/page.tsx
'use client';

// React 相关
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';

// 第三方库
import { App, Button, Col, Descriptions, Flex, Image, Popconfirm, Radio, Row, Spin, Select, Result, Input, InputNumber, Space, Timeline, Avatar, Tooltip } from 'antd';
import { SyncOutlined, UserSwitchOutlined, BlockOutlined, TagsOutlined, SendOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import axios from 'axios';
import dayjs from 'dayjs';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Viewer from 'react-viewer';
import { useSession } from 'next-auth/react';

// 内部组件
import { ReviewStatus, Stat, Tags } from '@/components/Review';
import itemRender from '@/components/itemRender';

// 样式文件
import 'viewerjs/dist/viewer.css';

/**
 * 动态导入 JSON 编辑器组件
 * 使用动态导入避免 SSR 问题
 */
const JsonEditor = dynamic(() => import('@/components/JsonEditor'), {
  ssr: false,
  loading: () => <Spin />,
});

/**
 * 帖子详情页面组件
 * 用于审核和查看帖子详细信息
 */
const PostDetailPage: React.FC = () => {
  // 路由参数
  const params = useParams();
  const { id } = params;
  const { message } = App.useApp();

  // 状态管理
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('image');
  
  // 图片查看器状态
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ src: string }[]>([]);

  // 输入框和冷却状态管理
  const [commentValue, setCommentValue] = useState('');
  const [numValue, setNumValue] = useState('');
  const [platformList, setPlatformList] = useState<string[]>([]);
  const [tagCooldown, setTagCooldown] = useState(0);
  const [repushCooldown, setRepushCooldown] = useState(0);

  // 路由对象
  const router = useRouter();

  // 获取用户会话信息
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      message.warning('请先登录');
      router.push('/dashboard/login');
    },
  }) as { data: any, status: string };

  // 常量定义
  const height = '500px';

  /**
   * 获取帖子数据
   * 根据 ID 从 API 获取帖子详细信息
   */
  useEffect(() => {
    if (!id) return;
    
    const fetchPost = async () => {
      try {
        const response = await axios.get(`/api/review?cid=${id}`);
        setPost(response.data.data);
      } catch (err: any) {
        setError(err.message || '请求出错');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [id]);

  // 处理冷却倒计时
  useEffect(() => {
    if (tagCooldown > 0) {
      const timer = setTimeout(() => setTagCooldown(tagCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [tagCooldown]);

  useEffect(() => {
    if (repushCooldown > 0) {
      const timer = setTimeout(() => setRepushCooldown(repushCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [repushCooldown]);

  /**
   * 处理所有审核及管理操作
   * @param action 操作类型
   * @param value 可选的操作值（如评论内容、编号）
   */
  const handleAction = async (action: string, value?: any) => {
    // 显示加载提示
    const key = `action-${action}-${Date.now()}`;
    message.loading({ content: '正在处理...', key });
    let data = {
      cid: id,
      ...(action === 'num' ? { num: value } : {}),
      ...(action === 'platform' ? { platform: value } : {}),
    };
    // 特殊处理需要前端状态更新的操作
    if (action === 'comment') setCommentValue('');
    if (action === 'num') setNumValue('');
    if (action === 'tag') setTagCooldown(60);
    if (action === 'repush') setRepushCooldown(60);
    if (action === 'platform') post.sender.platform = value;
    // 构造请求体
    const body: any = {
      action,
      data,
      auth: { mid: session.mid },
    };
    // 如果有额外的值，添加到请求体
    if (value) {
      body.data.reason = `${value}`;
    }
    try {
      const response = await axios.post('/api/review', body);
      if (response.data.code === 0) {
        message.success({ content: response.data.message || '操作成功', key });
      } else {
        throw new Error(response.data.message || '操作失败');
      }
    } catch (error: any) {
      message.error({
        content: error.response?.data?.message || error.message || '请求失败',
        key,
      });
    }
  };

  /**
   * 格式化 Base64 图片数据
   * @param base64 - Base64 编码的图片数据
   * @returns 完整的 data URL
   */
  const formatBase64 = (base64: string) => `data:image/jpeg;base64,${base64}`;

  /**
   * 显示图片查看器
   * @param index - 要显示的图片索引
   */
  const showViewer = (index = 0) => {
    if (!post?.images?.length) return;
    
    setViewerImages(
      post.images.map((img: string) => ({ src: formatBase64(img) }))
    );
    setViewerVisible(true);
  };

  // 加载状态处理
  if (loading) {
    return <PageContainer loading />;
  }
  
  // 错误状态处理
  if (error) {
    return <Result status="error" title="加载失败" subTitle={error} />;
  }
  
  // 数据不存在处理
  if (!post) {
    return <Result status="404" title="404" subTitle="抱歉，该帖子不存在。" />;
  }

  /**
   * 处理 JSON 内容保存
   * 将编辑后的 JSON 内容保存到服务器
   * @param updatedContent - 更新后的内容对象
   * @returns Promise<boolean> - 保存是否成功
   */
  const handleJsonSave = async (updatedContent: object): Promise<boolean> => {
    if (!post) return false;

    try {
      // 调用渲染 API 保存更新的内容
      const response = await axios.post(`/api/render`, {
        _id: id,
        type: 'post',
        content: updatedContent
      });
      
      // 更新服务器返回的数据
      setPost(response.data.data);
      
      // 立即更新本地状态以提供即时反馈
      setPost({ ...post, content: updatedContent });
      message.success('内容更新成功！');
      return true;
    } catch (error) {
      message.error('保存失败，请重试。');
      return false;
    }
  };

  /**
   * 渲染主视图内容
   * 根据当前选择的视图类型渲染不同的内容
   * @returns 渲染的主视图内容
   */
  const renderMainView = () => {
    switch (activeView) {
      case 'html':
        // HTML 渲染
        return (
          <iframe
            src={`/api/render?cid=${id}`}
            title="HTML"
            style={{ 
              width: '100%', 
              height, 
              border: '1px solid #f0f0f0', 
              borderRadius: '8px' 
            }}
          />
        );
        
      case 'json':
        // JSON 内容
        return (
          <div style={{ 
            maxHeight: height, 
            overflow: 'auto', 
            borderRadius: '8px' 
          }}>
            <SyntaxHighlighter 
              language="json" 
              style={vscDarkPlus} 
              showLineNumbers
            >
              {JSON.stringify(post.content, null, 2)}
            </SyntaxHighlighter>
          </div>
        );
        
      case 'edit':
        // JSON 编辑
        if (session?.user?.role !== 'sysop') {
          return (
            <Result
              status="403"
              title="403"
              subTitle="抱歉，您没有权限编辑此内容。"
            />
          );
        }
        return (
          <div style={{ 
            maxHeight: height, 
            overflow: 'auto', 
            borderRadius: '8px' 
          }}>
            <JsonEditor
              initialValue={post.content}
              onSave={handleJsonSave}
            />
          </div>
        );
        
      case 'image':
      default:
        // 显示图片（默认视图）
        return (
          <div style={{ 
            maxHeight: height, 
            overflow: 'auto', 
            textAlign: 'center', 
            background: '#f7f7f7', 
            borderRadius: '8px' 
          }}>
            {post.images?.length > 0 ? (
              <Image
                width="auto"
                style={{ maxWidth: '100%' }}
                src={formatBase64(post.images[0])}
                preview={{
                  visible: false, // 禁用 antd 自带的预览
                }}
                onClick={() => showViewer(0)} // 点击图片打开自定义查看器
              />
            ) : (
              <div style={{ padding: 24 }}>无图片</div>
            )}
          </div>
        );
    }
  };

  return (
    <PageContainer
      header={{
        title: '',
      }}
      breadcrumb={{
        items: [
          {
            path: '/review',
            title: '帖子审核',
          },
          {
            title: id,
          },
        ],
        itemRender
      }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={{ span: 24, order: 1 }} md={{ span: 16, order: 1 }}>
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
        </Col>

        <Col xs={{ span: 24, order: 4 }} md={{ span: 8, order: 2 }}>
          <ProCard>
            <Flex justify="space-between" align="center" style={{ height: 32 }}>
              <Radio.Group
                value={activeView}
                onChange={(e) => setActiveView(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="image">Image</Radio.Button>
                <Radio.Button value="html">HTML</Radio.Button>
                <Radio.Button value="json">JSON</Radio.Button>
                {session?.user?.role === 'sysop' && <Radio.Button value="edit">Edit</Radio.Button>}
              </Radio.Group>
            </Flex>
          </ProCard>
        </Col>

        <Col xs={{ span: 24, order: 5 }} md={{ span: 16, order: 3 }}>
          <ProCard style={{ height: '100%' }}>
            {renderMainView()}
          </ProCard>
        </Col>

        <Col xs={{ span: 24, order: 2 }} md={{ span: 8, order: 4 }}>
          <Flex vertical gap="middle" style={{ height: '100%' }}>
            <ProCard title="基本信息" style={{ flex: 1 }}>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="用户">
                  {`${post.content.nickname} (ID: ${post.content.userid})`}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <ReviewStatus status={post.type} />
                </Descriptions.Item>
                <Descriptions.Item label="标签">
                  <Tags tags={post.tags} />
                </Descriptions.Item>
                <Descriptions.Item label="票数">
                  <Stat 
                    approve={post.review.stat.approve} 
                    reject={post.review.stat.reject} 
                  />
                </Descriptions.Item>
                <Descriptions.Item label="发布账号">
                  <Tags platform={post.sender.platform} />
                </Descriptions.Item>
              </Descriptions>
            </ProCard>
            
            <ProCard title="审核操作">
              <Flex gap="small" wrap="wrap">
                <Button
                  type="primary"
                  style={{ backgroundColor: '#52c41a' }}
                  onClick={() => handleAction('approve')}
                >
                  通过
                </Button>
                <Button
                  type="primary"
                  danger
                  onClick={() => handleAction('reject')}
                >
                  拒绝
                </Button>
                {(session?.user?.role === 'admin' || session?.user?.role === 'sysop') && (
                  <>
                    <Popconfirm
                      title="确认强制通过？"
                      description="此操作将绕过常规审核流程。"
                      onConfirm={() => handleAction('approveforce')}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button icon={<SafetyOutlined />} type="dashed">强制通过</Button>
                    </Popconfirm>
                    <Popconfirm
                      title="确认强制拒绝？"
                      description="此操作将绕过常规审核流程。"
                      onConfirm={() => handleAction('rejectforce')}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button icon={<SafetyOutlined />} type="dashed">强制拒绝</Button>
                    </Popconfirm>
                    <Popconfirm
                      title="确认拉黑此用户？"
                      description="该用户将无法再发布内容。（其实是还没写解封）"
                      onConfirm={() => handleAction('block')}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button type="primary" danger ghost icon={<BlockOutlined />}>拉黑</Button>
                    </Popconfirm>
                    <Button icon={<SyncOutlined />} onClick={() => handleAction('retrial')}>重审</Button>
                    <Button icon={<UserSwitchOutlined />} onClick={() => handleAction('anonymous')}>切换匿名</Button>
                    <Button icon={<TagsOutlined />} onClick={() => handleAction('tag')} disabled={tagCooldown > 0}>
                      {tagCooldown > 0 ? `更新标签 (${tagCooldown}s)` : '更新标签'}
                    </Button>
                   <Button icon={<SendOutlined />} onClick={() => handleAction('repush')} disabled={repushCooldown > 0}>
                      {repushCooldown > 0 ? `重新推送 (${repushCooldown}s)` : '重新推送'}
                    </Button>
                    <Space.Compact>
                      <InputNumber placeholder="编号" min={0} value={numValue} onChange={(value: any) => setNumValue(value)} onPressEnter={() => numValue && handleAction('num', numValue)} changeOnWheel/>
                      <Button type="primary" onClick={() => handleAction('num', numValue)} disabled={!numValue || numValue === ''}>提交</Button>
                    </Space.Compact>
                    <Space.Compact>
                      <Select mode="tags" placeholder="aid" style={{ width: '100%' }} defaultValue={post.sender.platform} onChange={(value: string[]) => setPlatformList(value)} options={post.sender.platform.map((i: string) => ({ label: i, value: i }))}/>
                      <Button type="primary" onClick={() => handleAction('platform', platformList)} disabled={!platformList || platformList.length === 0 || platformList === post.sender.platform}>提交</Button>
                    </Space.Compact>
                  </>
                )}
                <Space.Compact>
                  <Input placeholder="评论" value={commentValue} onChange={(e) => setCommentValue(e.target.value)} onPressEnter={() => commentValue && handleAction('comment', commentValue)}/>
                  <Button type="primary" onClick={() => handleAction('comment', commentValue)} disabled={!commentValue || commentValue.trim() === ''}>提交</Button>
                </Space.Compact>
              </Flex>
            </ProCard>
          </Flex>
        </Col>

        <Col span={24} order={6}>
          <ProCard title="帖子图片列表">
            <Flex gap="small" wrap="wrap">
              {post.images.map((img: string, index: number) => (
                <Image
                  key={index}
                  width={80}
                  height={80}
                  src={formatBase64(img)}
                  preview={{ visible: false }}
                  style={{ 
                    cursor: 'pointer', 
                    objectFit: 'cover',
                    borderRadius: '4px'
                  }}
                  onClick={() => showViewer(index)}
                />
              ))}
              </Flex>
          </ProCard>
        </Col>

        <Col span={24} order={7}>
          <ProCard title="审核评论">
            {post.review?.comments?.length > 0 ? (
              <Timeline 
                mode="left"
                items={post.review.comments.map((comment: any, index: number) => ({
                  key: index,
                  label: (
                    <Tooltip 
                      title={
                        <div
                          style={{ display: 'flex' }}
                        >
                          <Avatar
                            size='large'
                            icon={<UserOutlined />}
                            src={`http://q.qlogo.cn/headimg_dl?dst_uin=${comment.mid}&spec=640&img_type=jpg`}
                            style={{ marginRight: 5 }}
                          />
                          <div>
                            <b>{comment.mid}</b>
                            <p>{dayjs(comment.timestamp).format('YYYY-MM-DD HH:mm:ss')}</p>
                          </div>
                        </div>
                      }
                    >
                      {comment.mid}
                    </Tooltip>
                  ),
                  children: comment.reason
                }))}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                暂无审核评论
              </div>
            )}
          </ProCard>
        </Col>
      </Row>

      {/* 图片查看器组件 */}
      <Viewer
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        images={viewerImages}
      />
    </PageContainer>
  );
};

export default PostDetailPage;
