/**
 * 主题资源管理模块
 * 管理Hexo主题所需的CSS和JS文件
 */

export interface ThemeResource {
  name: string
  description: string
  filename: string
  content: string
  type: 'css' | 'js'
  usage: string
}

// CSS资源内容
const customCssContent = `/* 书籍列表容器样式 */
#book {
width: 100%;
}

#book .page {
overflow: hidden;
border-radius: 3px;
width: 100%;
}

#book .content {
display: flex;
align-items: center;
width: 100%;
margin: 0;
justify-content: space-between;
flex-wrap: wrap;
padding: 16px;
text-align: justify;
}

/* 响应式布局 */
@media screen and (max-width: 877px) {
    #book .page .content {
    flex-direction: column;
    align-items: center;
    }
}

/* 书籍卡片样式 */
#book .content li {
width: 380px;
list-style: none;
margin-bottom: 16px;
border-radius: 8px;
transition: all .3s ease 0s, transform .6s cubic-bezier(.6, .2, .1, 1) 0s;
}

#book .content li .info {
border-radius: 8px;
display: flex;
justify-content: flex-start;
padding: 16px 12px;
line-height: 1.7;
list-style: none;
}

/* 书籍封面3D效果 */
.book-container {
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 600px;
}

.book {
    position: relative;
    width: 100px;
    height: 150px;
    transform-style: preserve-3d;
    transform: rotateY(-30deg);
    transition: 1s ease;
    list-style: none;
}

.book:before {
    content: " ";
    position: absolute;
    left: 0;
    top: 2px;
    width: 23px;
    height: 146px;
    transform: translateX(84.5px) rotateY(90deg);
    background: linear-gradient(90deg, #fff, #f9f9f9 5%, #fff 10%, #f9f9f9 15%, #fff 20%, #f9f9f9 25%, #fff 30%, #f9f9f9 35%, #fff 40%, #f9f9f9 45%, #fff 50%, #f9f9f9 55%, #fff 60%, #f9f9f9 65%, #fff 70%, #f9f9f9 75%, #fff 80%, #f9f9f9 85%, #fff 90%, #f9f9f9 95%, #fff);
}

.book > :first-child {
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 150px;
    transform: translateZ(12.5px);
    border-radius: 0 2px 2px 0;
    box-shadow: 5px 5px 20px #666;
}

.book:after {
    content: " ";
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 150px;
    transform: translateZ(-12.5px);
    background-color: #555;
    border-radius: 0 2px 2px 0;
}

/* 书籍信息卡片样式 */
#book .content li .info > div {
margin-left: 26px;
}

#book .content li .info h3 {
font-size: 16px;
position: unset;
background: none;
display: block;
text-overflow: ellipsis;
overflow: hidden;
white-space: nowrap;
}

#book .content li .info h3:before {
display: none;
}

#book .content li .info p {
font-size: 14px;
line-height: 1.7;
}

/* 悬浮效果 */
#book .content li:hover .book {
transform: rotateY(0deg);
}

/* 书籍简介弹出层 */
#book .info .info-card {
position: relative;
width: 250px;
overflow: hidden;
transition: .3s;
}

#book .info .info-card .hidden-content {
position: absolute;
display: flex;
justify-content: center;
align-items: center;
top: 50%;
left: 50%;
height: 0%;
transform: translate(-50%, -50%);
filter: blur(12px);
opacity: 0;
background: #fff;
width: 100%;
transition: .5s;
}

#book .info .info-card .hidden-content .text {
height: 80%;
width: 80%;
padding: 5px;
overflow: hidden;
text-overflow: ellipsis;
font-size: 14px;
color: #676767;
float: left;
clear: both;
text-align: justify;
}

#book .info .info-card .hidden-content .text::first-letter {
font-size: 20px;
float: left;
margin: 0 .2em 0 0;
}

#book .info a:hover + .info-card .hidden-content {
opacity: 1;
height: 100%;
width: 100%;
filter: unset;
}

#book .content li .info a[target="_blank"]:hover {
color: #0056b3;
text-decoration: underline;
}

#book .content li .info .pwd-text {
font-size: 16px;
color: #666;
margin-top: 3px;
}

/* 书单分页样式 */
.book-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0;
    padding: 15px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.search-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.search-input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 20px;
    font-size: 14px;
    width: 200px;
    outline: none;
    transition: all 0.3s ease;
}

.search-input:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.search-btn {
    padding: 8px 12px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s ease;
}

.search-btn:hover {
    background: #0056b3;
}

.book-stats {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 14px;
    color: #666;
}

.book-stats span {
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    font-weight: 500;
}

/* 分页导航样式 */
.pagination-container {
    display: flex;
    justify-content: center;
    margin: 30px 0;
}

.pagination {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.1);
    padding: 12px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.page-btn {
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    font-weight: 500;
}

.page-btn:hover:not(:disabled) {
    background: #0056b3;
    transform: translateY(-1px);
}

.page-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
}

.page-numbers {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0 10px;
}

.page-number {
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.8);
    color: #333;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    min-width: 36px;
    text-align: center;
}

.page-number:hover {
    background: #007bff;
    color: white;
    border-color: #007bff;
    transform: translateY(-1px);
}

.page-number.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
    font-weight: bold;
}

.page-ellipsis {
    color: #666;
    font-size: 14px;
    padding: 0 5px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
    .book-controls {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }

    .search-container {
        width: 100%;
        justify-content: center;
    }

    .search-input {
        width: 250px;
        max-width: 100%;
    }

    .book-stats {
        flex-direction: column;
        gap: 8px;
    }

    .pagination {
        flex-wrap: wrap;
        gap: 4px;
        padding: 8px;
    }

    .page-btn {
        padding: 6px 12px;
        font-size: 12px;
    }

    .page-number {
        padding: 4px 8px;
        min-width: 30px;
        font-size: 12px;
    }
}

/* 暗黑模式适配 */
@media (prefers-color-scheme: dark) {
    .book-controls {
        background: rgba(33, 33, 33, 0.9);
        border-color: rgba(255, 255, 255, 0.1);
    }

    .search-input {
        background: #333;
        color: #fff;
        border-color: #555;
    }

    .search-input:focus {
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .book-stats span {
        background: rgba(255, 255, 255, 0.1);
        color: #ccc;
    }

    .pagination {
        background: rgba(33, 33, 33, 0.9);
        border-color: rgba(255, 255, 255, 0.1);
    }

    .page-number {
        background: rgba(255, 255, 255, 0.1);
        color: #ccc;
        border-color: #555;
    }

    .page-number:hover {
        background: #007bff;
        color: white;
    }
}

[data-user-color-scheme='dark'] .book-controls {
    background: rgba(33, 33, 33, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
}

[data-user-color-scheme='dark'] .search-input {
    background: #333;
    color: #fff;
    border-color: #555;
}

[data-user-color-scheme='dark'] .search-input:focus {
    border-color: #007bff;
}

[data-user-color-scheme='dark'] .book-stats span {
    background: rgba(255, 255, 255, 0.1);
    color: #ccc;
}

[data-user-color-scheme='dark'] .pagination {
    background: rgba(33, 33, 33, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
}

[data-user-color-scheme='dark'] .page-number {
    background: rgba(255, 255, 255, 0.1);
    color: #ccc;
    border-color: #555;
}

[data-user-color-scheme='dark'] .page-number:hover {
    background: #007bff;
    color: white;
}`

// JS资源内容
const bookPaginationJsContent = `/**
 * 书单分页功能
 * 支持分页显示、搜索、筛选功能
 */

class BookPagination {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.allBooks = [];
        this.filteredBooks = [];
        this.searchQuery = '';
        
        this.init();
    }

    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupPagination();
            });
        } else {
            this.setupPagination();
        }
    }

    setupPagination() {
        const bookContainer = document.querySelector('#book .content');
        if (!bookContainer) return;

        // 获取所有书籍
        this.allBooks = Array.from(bookContainer.querySelectorAll('li'));
        this.filteredBooks = [...this.allBooks];

        // 创建控制面板
        this.createControls();
        
        // 显示第一页
        this.showPage(1);
        
        // 绑定事件
        this.bindEvents();
    }

    createControls() {
        const bookDiv = document.querySelector('#book');
        if (!bookDiv) return;

        // 创建控制面板
        const controlsHTML = \`
            <div class="book-controls">
                <div class="search-container">
                    <input type="text" id="book-search" placeholder="搜索书名或作者..." class="search-input">
                    <button id="search-btn" class="search-btn">🔍</button>
                </div>
                <div class="book-stats">
                    <span id="book-count">共 \${this.allBooks.length} 本书</span>
                    <span id="page-info">第 1 页</span>
                </div>
            </div>
        \`;

        // 创建分页导航
        const paginationHTML = \`
            <div class="pagination-container">
                <div class="pagination">
                    <button id="prev-btn" class="page-btn" disabled>‹ 上一页</button>
                    <div id="page-numbers" class="page-numbers"></div>
                    <button id="next-btn" class="page-btn">下一页 ›</button>
                </div>
            </div>
        \`;

        // 插入控制面板
        bookDiv.insertAdjacentHTML('afterbegin', controlsHTML);
        bookDiv.insertAdjacentHTML('beforeend', paginationHTML);
    }

    bindEvents() {
        // 搜索功能
        const searchInput = document.getElementById('book-search');
        const searchBtn = document.getElementById('search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
        }

        // 分页按钮
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.showPage(this.currentPage - 1);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredBooks.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.showPage(this.currentPage + 1);
                }
            });
        }
    }

    performSearch(query) {
        this.searchQuery = query.toLowerCase().trim();
        
        if (this.searchQuery === '') {
            this.filteredBooks = [...this.allBooks];
        } else {
            this.filteredBooks = this.allBooks.filter(book => {
                const title = book.querySelector('h3')?.textContent.toLowerCase() || '';
                const author = book.querySelector('p')?.textContent.toLowerCase() || '';
                return title.includes(this.searchQuery) || author.includes(this.searchQuery);
            });
        }

        this.currentPage = 1;
        this.showPage(1);
        this.updateStats();
    }

    showPage(page) {
        this.currentPage = page;
        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;

        // 隐藏所有书籍
        this.allBooks.forEach(book => {
            book.style.display = 'none';
        });

        // 显示当前页的书籍
        this.filteredBooks.slice(startIndex, endIndex).forEach(book => {
            book.style.display = 'block';
        });

        this.updatePagination();
        this.updateStats();
        this.scrollToTop();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredBooks.length / this.itemsPerPage);
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const pageNumbers = document.getElementById('page-numbers');

        // 更新按钮状态
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages;
        }

        // 更新页码
        if (pageNumbers) {
            pageNumbers.innerHTML = '';
            
            if (totalPages <= 7) {
                // 显示所有页码
                for (let i = 1; i <= totalPages; i++) {
                    this.createPageNumber(i, pageNumbers);
                }
            } else {
                // 显示部分页码
                this.createPageNumber(1, pageNumbers);
                
                if (this.currentPage > 4) {
                    pageNumbers.insertAdjacentHTML('beforeend', '<span class="page-ellipsis">...</span>');
                }
                
                const start = Math.max(2, this.currentPage - 2);
                const end = Math.min(totalPages - 1, this.currentPage + 2);
                
                for (let i = start; i <= end; i++) {
                    this.createPageNumber(i, pageNumbers);
                }
                
                if (this.currentPage < totalPages - 3) {
                    pageNumbers.insertAdjacentHTML('beforeend', '<span class="page-ellipsis">...</span>');
                }
                
                if (totalPages > 1) {
                    this.createPageNumber(totalPages, pageNumbers);
                }
            }
        }
    }

    createPageNumber(pageNum, container) {
        const pageBtn = document.createElement('button');
        pageBtn.className = \`page-number \${pageNum === this.currentPage ? 'active' : ''}\`;
        pageBtn.textContent = pageNum;
        pageBtn.addEventListener('click', () => {
            this.showPage(pageNum);
        });
        container.appendChild(pageBtn);
    }

    updateStats() {
        const bookCount = document.getElementById('book-count');
        const pageInfo = document.getElementById('page-info');
        const totalPages = Math.ceil(this.filteredBooks.length / this.itemsPerPage);

        if (bookCount) {
            if (this.searchQuery) {
                bookCount.textContent = \`找到 \${this.filteredBooks.length} 本书\`;
            } else {
                bookCount.textContent = \`共 \${this.allBooks.length} 本书\`;
            }
        }

        if (pageInfo) {
            if (totalPages === 0) {
                pageInfo.textContent = '无结果';
            } else {
                pageInfo.textContent = \`第 \${this.currentPage} 页，共 \${totalPages} 页\`;
            }
        }
    }

    scrollToTop() {
        const bookDiv = document.querySelector('#book');
        if (bookDiv) {
            bookDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// 初始化书单分页功能
new BookPagination();`

export const themeResources: ThemeResource[] = [
  {
    name: 'Hexo书单样式',
    description: '书籍展示的CSS样式，包含3D封面效果、分页导航、响应式布局和暗黑模式适配',
    filename: 'custom.css',
    content: customCssContent,
    type: 'css',
    usage: '将此CSS内容片段添加到Fluid主题的 /source/css/custom.css 文件中'
  },
  {
    name: '书单分页功能',
    description: '书籍分页显示的JavaScript功能，支持搜索、筛选和分页导航',
    filename: 'book-pagination.js',
    content: bookPaginationJsContent,
    type: 'js',
    usage: '将此JS文件保存到Fluid主题的 /source/js/ 目录中，然后在index.md底部引入'
  }
]

/**
 * 获取所有主题资源
 */
export function getThemeResources(): ThemeResource[] {
  return themeResources
}

/**
 * 根据类型获取资源
 */
export function getResourcesByType(type: 'css' | 'js'): ThemeResource[] {
  return themeResources.filter(resource => resource.type === type)
}

/**
 * 根据文件名获取资源
 */
export function getResourceByFilename(filename: string): ThemeResource | undefined {
  return themeResources.find(resource => resource.filename === filename)
}