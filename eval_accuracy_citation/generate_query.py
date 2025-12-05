import os
import json
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# 加载 .env 文件中的环境变量
load_dotenv()


def read_documents(documents_dir):
    """
    读取文档集中的所有文档内容
    
    Args:
        documents_dir: 文档集目录路径
        
    Returns:
        文档内容字典，键为文件名，值为文档内容
    """
    documents = {}
    doc_dir = Path(documents_dir)
    
    for doc_path in doc_dir.glob("*.md"):
        if doc_path.name != "README.md":  # 跳过README文件
            try:
                with open(doc_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    documents[doc_path.name] = content
            except Exception as e:
                print(f"读取文档 {doc_path.name} 失败: {e}")
    
    return documents

def generate_test_cases(documents, output_file):
    """
    从文档内容生成测试用例
    
    Args:
        documents: 文档内容字典
        output_file: 输出文件路径
    """
    # 准备文档内容
    docs_content = "\n\n".join([f"# {doc_name}\n{content}" for doc_name, content in documents.items()])
    
    # 设计提示
    prompt = f"""
    你需要基于以下文档内容，生成与`sample_dataset.json`格式一致的测试用例数据。
    
    文档内容：
    {docs_content}
    
    输出格式要求：
    1. 输出一个JSON对象，包含一个名为"test_cases"的数组
    2. 每个数组元素包含：
       - "question": 用户问题
       - "ground_truth": 基于文档内容的标准答案
       - "project": 固定为"lightrag_evaluation_sample"
    3. 生成6个测试用例，涵盖不同的文档主题
    4. 问题应该多样化，覆盖不同类型的查询
    5. 答案应该准确反映文档内容，并且结构清晰
    
    请只输出JSON内容，不要包含其他解释性文本。
    """
    
    # 调用OpenAI API生成测试用例
    response = openai_complete_if_cache(
        model=None, 
        prompt=prompt, 
        system_prompt="你是一个专业的RAG测试用例生成专家，能够根据文档内容生成高质量的测试用例。",
        temperature=0.3  # 较低的温度值确保输出更准确
    )
    
    try:
        # 清理生成的内容，去除可能的Markdown代码块标记
        cleaned_response = response.strip()
        if cleaned_response.startswith('```json'):
            cleaned_response = cleaned_response[7:]  # 去除开头的 ```json
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]  # 去除结尾的 ```
        cleaned_response = cleaned_response.strip()  # 再次去除首尾空白
        
        # 解析生成的JSON
        test_cases_data = json.loads(cleaned_response)
        
        # 验证数据格式
        if "test_cases" in test_cases_data and isinstance(test_cases_data["test_cases"], list):
            # 保存到文件
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(test_cases_data, f, ensure_ascii=False, indent=2)
            print(f"测试用例已成功生成并保存到 {output_file}")
            return test_cases_data
        else:
            print("生成的数据格式不符合要求")
            return None
    except json.JSONDecodeError as e:
        print(f"解析生成的JSON失败: {e}")
        print("生成的原始内容:", response)
        print("清理后的内容:", cleaned_response)
        return None

def openai_complete_if_cache(
    model=None, prompt=None, system_prompt=None, history_messages=[], **kwargs
) -> str:
    # 从环境变量读取配置
    llm_binding = os.getenv("LLM_BINDING", "openai")
    llm_binding_host = os.getenv("LLM_BINDING_HOST")
    llm_binding_api_key = os.getenv("LLM_BINDING_API_KEY")
    
    # 如果没有指定模型，则从环境变量读取
    if model is None:
        model = os.getenv("LLM_MODEL", "gpt-4o-mini")
    
    # 创建 OpenAI 客户端（支持 OpenAI 兼容的 API）
    openai_client = OpenAI(
        api_key=llm_binding_api_key,
        base_url=llm_binding_host
    )

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.extend(history_messages)
    messages.append({"role": "user", "content": prompt})

    response = openai_client.chat.completions.create(
        model=model, messages=messages, **kwargs
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    # 配置路径
    DOCUMENTS_DIR = "c:\\Users\\王子豪\\PycharmProjects\\ai-doc-helper\\lightrag\\evaluation\\sample_documents"
    OUTPUT_FILE = "c:\\Users\\王子豪\\PycharmProjects\\ai-doc-helper\\lightrag\\evaluation\\generated_dataset.json"
    
    try:
        # 读取文档
        print(f"正在读取文档集...")
        documents = read_documents(DOCUMENTS_DIR)
        
        if not documents:
            print("未读取到任何文档")
            exit(1)
            
        print(f"成功读取 {len(documents)} 个文档")
        
        # 生成测试用例
        print(f"正在生成测试用例...")
        test_cases_data = generate_test_cases(documents, OUTPUT_FILE)
        
        if test_cases_data:
            print(f"生成完成！共生成 {len(test_cases_data['test_cases'])} 个测试用例")
        else:
            print("生成失败")
            exit(1)
            
    except Exception as e:
        print(f"执行过程中发生错误: {e}")
        exit(1)