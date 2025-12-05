# 评测脚本使用文档

## 脚本概述

`eval_accuracy_citation.py` 是一个用于评测 RAG（检索增强生成）系统回答质量的工具脚本，主要计算两个关键指标：

- **准确率**：评估模型回答是否至少覆盖了标准答案中的一个关键点
- **引用率**：评估模型回答是否引用了预期的正确文档

## 功能特性

- ✅ 从 JSONL 格式的评测数据集加载测试用例
- ✅ 自动调用 LightRAG API 生成回答
- ✅ 计算整体准确率和引用率统计数据
- ✅ 输出每个测试用例的详细评测结果
- ✅ 生成带颜色标记的控制台输出日志
- ✅ 保存评测结果为 JSON 格式文件
- ✅ 初步生成可视化的简单 HTML 评测报告页面
- ✅ 提供灵活的命令行参数配置

## 安装要求

脚本需要以下 Python 依赖：

```bash
# 安装所需依赖
pip install httpx
```

## 数据准备

在运行评测前，请确保已将 `LightRAG-main/lightrag/evaluation/sample_documents` 目录中的所有文档上传到 LightRAG 系统中。这些文档包含评测问题所需的背景知识，评测结果的准确性依赖于这些文档是否已正确上传。

上传文档的方法：

1. 通过 LightRAG 的 Web UI 界面上传
2. 或者使用 LightRAG 的 API 进行批量上传

## 评测数据集格式

脚本使用 JSONL 格式的评测数据集文件（如 `EVAL.md`），每行包含一个 JSON 对象，具有以下字段：

```json
{
  "q": "问题文本",
  "gold": ["标准答案要点1", "标准答案要点2"],
  "doc_hint": ["预期引用的文档名1", "预期引用的文档名2"]
}
```

### 字段说明

- **q**：测试问题
- **gold**：标准答案的关键点数组，模型回答需要覆盖至少一个点才算准确
- **doc_hint**：预期引用的文档名数组，模型回答需要引用至少一个文档才算引用正确

## 使用方法

### 基本使用

使用默认参数运行评测：

```bash
python lightrag/evaluation/eval_accuracy_citation.py
```

这将使用默认的评测数据集 `lightrag/evaluation/EVAL.md` 和默认的 API 端点 `http://localhost:9621`。

### 指定评测数据集

```bash
python lightrag/evaluation/eval_accuracy_citation.py --dataset path/to/your_evaluation.md
```

### 指定 RAG API 端点

```bash
python lightrag/evaluation/eval_accuracy_citation.py --ragendpoint http://your-rag-api-url:port
```

### 混合使用参数

```bash
python lightrag/evaluation/eval_accuracy_citation.py --dataset custom_eval.md --ragendpoint http://localhost:9621
```

### 查看帮助信息

```bash
python lightrag/evaluation/eval_accuracy_citation.py --help
```

## 命令行参数说明

| 参数            | 简写 | 说明                  | 默认值                        |
| --------------- | ---- | --------------------- | ----------------------------- |
| `--dataset`     | `-d` | 评测数据集文件路径    | `lightrag/evaluation/EVAL.md` |
| `--ragendpoint` | `-r` | LightRAG API 端点 URL | `http://localhost:9621`       |

## 环境变量配置

脚本支持以下环境变量：

- `LIGHTRAG_API_URL`：设置默认的 API 端点 URL
- `LIGHTRAG_API_KEY`：设置 API 访问密钥（如果需要身份验证）

## 评测结果输出

### 控制台输出

脚本运行时会在控制台显示详细的评测过程和结果：

```
2025-11-28 17:09:01,234 - INFO - === 评测配置 ===
2025-11-28 17:09:01,234 - INFO - 评测数据集: EVAL.md
2025-11-28 17:09:01,234 - INFO - 总用例数: 10
2025-11-28 17:09:01,234 - INFO - LightRAG API: http://localhost:9621
2025-11-28 17:09:01,234 - INFO - =================

2025-11-28 17:09:01,234 - INFO - [EVAL] 评测开始，总用例数：10
2025-11-28 17:09:01,234 - INFO - [EVAL] 正在处理 Q1: LightRAG 是如何解决幻觉问题的？...
2025-11-28 17:09:05,123 - INFO - [EVAL] Q1 - 准确率：√ | 引用率：√
2025-11-28 17:09:05,123 - INFO - [EVAL] 正在处理 Q2: RAG 系统的三个主要组件是什么？...
2025-11-28 17:09:08,456 - INFO - [EVAL] Q2 - 准确率：×（未覆盖任何gold关键点） | 引用率：×（未引用任何文档）
...
2025-11-28 17:09:23,042 - INFO - [EVAL] 评测完成 - 整体准确率：20.0% | 整体引用率：10.0%

2025-11-28 17:09:23,042 - INFO - Notes:
2025-11-28 17:09:23,042 - INFO - 1. Q1: 准确率和引用率均符合预期，回答完整覆盖gold关键点且引用了正确文档 '01_lightrag_overview.md'。
2025-11-28 17:09:23,042 - INFO - 2. Q2: 未覆盖任何gold关键点（预期提及'检索系统, 嵌入模型, 大型语言模型'），未引用任何文档，预期引用 '02_rag_architecture.md'
...

2025-11-28 17:09:23,044 - INFO - 评测结果已保存到：lightrag/evaluation/results/eval_results_20251128_170923.json
2025-11-28 17:09:23,044 - INFO - HTML报告已保存到：lightrag/evaluation/results/eval_results_20251128_170923.html
```

### 输出文件

评测结果会保存到以下文件：

1. **JSON 结果文件**：`lightrag/evaluation/results/eval_results_YYYYMMDD_HHMMSS.json`
    - 包含完整的评测数据、指标和详细结果

2. **HTML 报告页面**：`lightrag/evaluation/results/eval_results_YYYYMMDD_HHMMSS.html`
    - 可视化展示评测结果，包括整体指标、单例结果和错误汇总
    - 可以在浏览器中打开查看

## 评测标准详解

### 准确率计算

准确率判断基于以下规则：

1. 模型回答需要至少覆盖 `gold` 数组中的一个关键点
2. 使用不区分大小写的模糊匹配算法
3. 对于短关键点（≤5个字符）：要求词边界精确匹配
4. 对于长关键点：使用分词匹配，允许中间有其他字符

### 引用率计算

引用率判断基于以下规则：

1. 检查模型返回的 `references` 中是否包含 `doc_hint` 中的文档
2. 会从引用对象的多个可能字段中提取文档名（`file_name`, `filename`, `title`, `source`）
3. 只检查文件名部分，忽略路径
4. 使用不区分大小写的子字符串匹配

## 示例结果说明

### Notes 记录格式

每个测试用例的 Notes 记录遵循以下格式：

- **通过的用例**：

  ```
  Q1: 准确率和引用率均符合预期，回答完整覆盖gold关键点且引用了正确文档 '01_lightrag_overview.md'。
  ```

- **失败的用例**：

  ```
  Q2: 未覆盖任何gold关键点（预期提及'检索系统, 嵌入模型, 大型语言模型'），未引用任何文档，预期引用 '02_rag_architecture.md'
  ```

### HTML 报告说明

HTML 报告包含以下部分：

1. **整体指标**：显示准确率和引用率的百分比和通过数量
2. **单例结果表格**：列出每个测试用例的问题、回答、准确率和引用率状态
3. **错误汇总**：汇总所有未通过的测试用例及其错误原因



### 1. 基础配置

**评测数据集**
- 默认路径：`ai-doc-helper\lightrag\evaluation\generated_dataset.json`
- 可以通过`--dataset`参数指定自定义数据集路径
- 数据集格式需符合JSON格式，包含test_cases数组，每个测试用例包含question、ground_truth、expected_docs和project字段

**RAG API端点**
- 默认地址：`http://localhost:9621`
- 可以通过`--ragendpoint`参数指定自定义API地址
- 也可以通过`LIGHTRAG_API_URL`环境变量设置

### 2. RAGAS评估配置（可选，启用时需要）

**LLM配置**
- `EVAL_LLM_MODEL`：评估使用的LLM模型，默认`gpt-4o-mini`
- `EVAL_LLM_BINDING_API_KEY`：LLM的API密钥（必填）
  - 或使用`OPENAI_API_KEY`环境变量替代
- `EVAL_LLM_BINDING_HOST`：LLM的API端点（可选）

**嵌入配置**
- `EVAL_EMBEDDING_MODEL`：评估使用的嵌入模型，默认`text-embedding-3-large`
- `EVAL_EMBEDDING_BINDING_API_KEY`：嵌入模型的API密钥（可选，默认使用LLM的API密钥）
- `EVAL_EMBEDDING_BINDING_HOST`：嵌入模型的API端点（可选，默认使用LLM的API端点）

**性能调优**
- `EVAL_MAX_CONCURRENT`：最大并发数
- `EVAL_QUERY_TOP_K`：查询的top k结果数
- `EVAL_LLM_MAX_RETRIES`：LLM调用的最大重试次数，默认5
- `EVAL_LLM_TIMEOUT`：LLM调用的超时时间，默认180秒

### 3. 依赖安装

**基础依赖**
```bash
pip install httpx argparse asyncio json logging os re sys time datetime pathlib
```

**RAGAS依赖（启用RAGAS时需要）**
```bash
pip install ragas datasets langfuse
```

### 4. 运行示例

**基本运行**
```bash
python eval_accuracy.py
```

**指定数据集和API端点**
```bash
python eval_accuracy.py --dataset EVAL.md --ragendpoint http://localhost:9621
```

**启用RAGAS评估**
```bash
# 设置必要的环境变量
export EVAL_LLM_BINDING_API_KEY=your_api_key
# 运行脚本启用RAGAS
python eval_accuracy.py --enable-ragas
```

### 注意事项

1. 如果不启用RAGAS评估，不需要配置RAGAS相关的环境变量
2. 确保RAG API服务正在运行（默认端口9621）
3. 评测结果将保存在`eval_accuracy_citation/results`目录下，包括JSON格式的详细结果和HTML格式的可视化报告
4. 如果使用自定义数据集，确保格式符合要求，包含所有必要字段