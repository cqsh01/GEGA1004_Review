# backend/chapters_manager.py
import json
from pathlib import Path
from datetime import datetime

class ChaptersManager:
    def __init__(self, chapters_json_path):
        self.chapters_json_path = Path(chapters_json_path)
    
    def load_chapters(self):
        """加载 chapters.json"""
        try:
            with open(self.chapters_json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('chapters', [])
        except FileNotFoundError:
            return []
        except json.JSONDecodeError:
            raise Exception("chapters.json 格式错误")
    
    def chapter_exists(self, chapter_id):
        """检查章节 ID 是否已存在"""
        chapters = self.load_chapters()
        return any(c.get('id') == chapter_id for c in chapters)
    
    def add_chapter(self, chapter_data):
        """添加新章节"""
        chapters = self.load_chapters()
        
        # 检查是否已存在
        if self.chapter_exists(chapter_data['id']):
            raise Exception(f"章节 ID '{chapter_data['id']}' 已存在")
        
        # 添加新章节
        chapters.append(chapter_data)
        
        # 保存
        self._save_chapters(chapters)
        return True
    
    def update_chapter(self, chapter_id, chapter_data):
        """更新已存在的章节"""
        chapters = self.load_chapters()
        
        # 查找并更新
        updated = False
        for i, chapter in enumerate(chapters):
            if chapter.get('id') == chapter_id:
                chapters[i] = chapter_data
                updated = True
                break
        
        if not updated:
            raise Exception(f"章节 ID '{chapter_id}' 不存在")
        
        self._save_chapters(chapters)
        return True
    
    def add_or_update_chapter(self, chapter_data):
        """添加或更新章节（智能判断）"""
        if self.chapter_exists(chapter_data['id']):
            self.update_chapter(chapter_data['id'], chapter_data)
            return "updated"
        else:
            self.add_chapter(chapter_data)
            return "added"
    
    def _save_chapters(self, chapters):
        """保存 chapters.json"""
        data = {"chapters": chapters}
        
        # 先备份原文件
        if self.chapters_json_path.exists():
            backup_path = self.chapters_json_path.with_suffix('.json.backup')
            with open(self.chapters_json_path, 'r', encoding='utf-8') as f:
                content = f.read()
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(content)
        
        # 保存新文件
        with open(self.chapters_json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def count_questions_in_file(self, json_file_path):
        """统计 JSON 文件中的题目数量"""
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return len(data.get('questions', []))
        except:
            return 0
    
    def generate_chapter_config(self, chapter_id, title, description="", 
                                week="", instructor="", date="", 
                                json_file_path=None):
        """生成章节配置对象"""
        
        # 自动统计题目数量
        question_count = 0
        if json_file_path:
            question_count = self.count_questions_in_file(json_file_path)
        
        # 如果没有提供日期，使用当前日期
        if not date:
            date = datetime.now().strftime("%d-%b-%Y")
        
        return {
            "id": chapter_id,
            "title": title,
            "week": week or "TBD",
            "instructor": instructor or "TBD",
            "date": date,
            "fileName": f"{chapter_id}.json",
            "questionCount": question_count,
            "description": description or title
        }
    
    def get_next_week_number(self):
        """获取下一个周次（自动递增）"""
        chapters = self.load_chapters()
        if not chapters:
            return "W1"
        
        # 提取所有 Week 编号
        week_numbers = []
        for chapter in chapters:
            week = chapter.get('week', '')
            if week.startswith('W') and week[1:].isdigit():
                week_numbers.append(int(week[1:]))
        
        if week_numbers:
            next_week = max(week_numbers) + 1
            return f"W{next_week}"
        
        return "W1"