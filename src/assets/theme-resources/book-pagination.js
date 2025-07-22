/**
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
        const controlsHTML = `
            <div class="book-controls">
                <div class="search-container">
                    <input type="text" id="book-search" placeholder="搜索书名或作者..." class="search-input">
                    <button id="search-btn" class="search-btn">🔍</button>
                </div>
                <div class="book-stats">
                    <span id="book-count">共 ${this.allBooks.length} 本书</span>
                    <span id="page-info">第 1 页</span>
                </div>
            </div>
        `;

        // 创建分页导航
        const paginationHTML = `
            <div class="book-pagination-container">
                <div class="book-pagination">
                    <button id="prev-btn" class="book-page-btn" disabled>‹ 上一页</button>
                    <div id="page-numbers" class="book-page-numbers"></div>
                    <button id="next-btn" class="book-page-btn">下一页 ›</button>
                </div>
            </div>
        `;

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
                    pageNumbers.insertAdjacentHTML('beforeend', '<span class="book-page-ellipsis">...</span>');
                }
                
                const start = Math.max(2, this.currentPage - 2);
                const end = Math.min(totalPages - 1, this.currentPage + 2);
                
                for (let i = start; i <= end; i++) {
                    this.createPageNumber(i, pageNumbers);
                }
                
                if (this.currentPage < totalPages - 3) {
                    pageNumbers.insertAdjacentHTML('beforeend', '<span class="book-page-ellipsis">...</span>');
                }
                
                if (totalPages > 1) {
                    this.createPageNumber(totalPages, pageNumbers);
                }
            }
        }
    }

    createPageNumber(pageNum, container) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `book-page-number ${pageNum === this.currentPage ? 'active' : ''}`;
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
                bookCount.textContent = `找到 ${this.filteredBooks.length} 本书`;
            } else {
                bookCount.textContent = `共 ${this.allBooks.length} 本书`;
            }
        }

        if (pageInfo) {
            if (totalPages === 0) {
                pageInfo.textContent = '无结果';
            } else {
                pageInfo.textContent = `第 ${this.currentPage} 页，共 ${totalPages} 页`;
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
new BookPagination();