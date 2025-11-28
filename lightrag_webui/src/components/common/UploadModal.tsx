import { useState, useEffect } from 'react';
import Dropzone, { FileRejection } from 'react-dropzone';
import { X, UploadCloud, CheckCircle2, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import { uploadDocument } from '@/api/lightrag';
import { Toast } from '../common/Toast';
import { cn } from '../../lib/utils';
import { useUploadStore } from '@/stores/useUploadStore';

interface UploadModalProps {
  onUploadComplete?: () => void | Promise<void>;
}

interface InnerFileUploaderProps {
  disabled?: boolean;
  maxSize?: number;
  maxFileCount?: number;
  multiple?: boolean;
  files: File[];
  progresses: Record<string, number>;
  errors: Record<string, string>;
  setFiles: (files: File[]) => void;
  removeFile: (idx: number) => void;
  setError: (fileName: string, message: string) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const InnerFileUploader = ({
  disabled = false,
  maxSize = 200 * 1024 * 1024,
  maxFileCount = Infinity,
  multiple = true,
  files,
  progresses,
  errors,
  setFiles,
  removeFile,
  setError,
}: InnerFileUploaderProps) => {
  const onDrop = (accepted: File[], rejected: FileRejection[]) => {
    const next = [...files, ...accepted];
    if (next.length <= maxFileCount) {
      setFiles(next);
    }

    rejected.forEach(({ file, errors }) => {
      const msg = errors[0]?.message ?? '文件不支持';
      setError(file.name, msg);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        onDrop={onDrop}
        maxSize={maxSize}
        disabled={disabled}
        multiple={multiple}
      >
        {({ getRootProps, getInputProps }) => (
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 grid place-items-center cursor-pointer transition-all',
              // 优化：微调了 hover 状态的背景色，使其更融合
              'hover:border-blue-400 hover:bg-blue-50/50',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3 text-gray-600">
              <Upload className="w-8 h-8 text-blue-500/80" />
              <p className="text-sm font-medium text-gray-700">点击或拖拽文件上传</p>
              <p className="text-xs text-gray-400">支持 PDF / MD / TXT / DOCX</p>
            </div>
          </div>
        )}
      </Dropzone>

      {/* 文件列表区域 */}
      <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
        {files.map((file, idx) => {
          const error = errors[file.name];
          const progress = progresses[file.name] ?? 0;

          return (
            <div
              key={file.name + idx}
              className={cn(
                'flex items-center p-3 rounded-lg border transition-all',
                // 优化：统一背景为白色，错误时才变红，悬浮时增加轻微阴影
                error
                  ? 'border-red-200 bg-red-50/30'
                  : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm',
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center mr-3',
                error ? 'bg-red-100' : 'bg-gray-100'
              )}>
                {file.type.startsWith('image/') ? (
                  <ImageIcon className={cn('w-5 h-5', error ? 'text-red-500' : 'text-gray-500')} />
                ) : (
                  <FileText className={cn('w-5 h-5', error ? 'text-red-500' : 'text-gray-500')} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="truncate text-gray-700">{file.name}</span>
                  {/* ✨ 优化：使用 formatFileSize 显示正确单位 */}
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    {formatFileSize(file.size)}
                  </span>
                </div>

                {error ? (
                  <p className="text-xs text-red-500">{error}</p>
                ) : (
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              <button
                className="ml-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                onClick={() => removeFile(idx)}
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const UploadModal = ({ onUploadComplete }: UploadModalProps) => {
  const isOpen = useUploadStore((s) => s.isOpen);
  const close = useUploadStore((s) => s.close);

  const [files, setFiles] = useState<File[]>([]);
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'warning' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  const resetState = () => {
    setFiles([]);
    setProgresses({});
    setErrors({});
    setUploading(false);
    setFinished(false);
    setToast({ show: false, message: '', type: 'info' });
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const setProgress = (fileName: string, percent: number) => {
    setProgresses((prev) => ({ ...prev, [fileName]: percent }));
  };

  const setError = (fileName: string, message: string) => {
    setErrors((prev) => ({ ...prev, [fileName]: message }));
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const target = prev[idx];
      const next = prev.filter((_, i) => i !== idx);

      if (target) {
        setProgresses((p) => {
          const copy = { ...p };
          delete copy[target.name];
          return copy;
        });
        setErrors((p) => {
          const copy = { ...p };
          delete copy[target.name];
          return copy;
        });
      }

      return next;
    });
  };

  const showToast = (
    message: string,
    type: 'success' | 'warning' | 'info',
  ) => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  const startUpload = async () => {
    if (files.length === 0 || uploading || finished) return;

    setUploading(true);
    let hasSuccess = false;

    for (const file of files) {
      try {
        setProgress(file.name, 0);

        const res = await uploadDocument(file, (percent: number) => {
          setProgress(file.name, percent);
        });

        if (res.status === 'success') {
          hasSuccess = true;
          setProgress(file.name, 100);
        } else {
          setError(file.name, '上传失败，请稍后重试');
        }
      } catch {
        setError(file.name, '上传失败，请检查网络或稍后再试');
      }
    }

    setUploading(false);
    setFinished(true);

    if (hasSuccess) {
      showToast('上传完成，后台处理中', 'success');
      if (onUploadComplete) {
        await onUploadComplete();
      }
      setTimeout(() => close(), 1200);
    } else {
      showToast('全部失败，请检查文件', 'warning');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <div className="w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h1 className="text-lg font-bold text-gray-800">上传文档</h1>
            <p className="text-xs text-gray-500 mt-1">支持 PDF、TXT、MD、DOCX（最大 200MB）</p>
          </div>
          <button
            disabled={uploading}
            onClick={close}
            aria-label="取消上传文件"
            className={cn(
              'p-2 rounded-full transition-colors',
              uploading ? 'text-gray-300' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
          <InnerFileUploader
            disabled={uploading || finished}
            maxFileCount={Infinity}
            multiple
            maxSize={200 * 1024 * 1024}
            files={files}
            progresses={progresses}
            errors={errors}
            setFiles={setFiles}
            removeFile={removeFile}
            setError={setError}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center">
          <span className="text-xs text-gray-500 font-medium">
            {files.length > 0 ? `已选择 ${files.length} 个文件` : ''}
          </span>

          <button
            onClick={startUpload}
            disabled={files.length === 0 || uploading || finished}
            aria-label="上传所选文件"
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all transform active:scale-95',
              files.length === 0 || uploading || finished
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
            )}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                上传中…
              </>
            ) : finished ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                完成
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                确认上传
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
