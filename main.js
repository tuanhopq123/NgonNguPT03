
    // --- 1. KHỞI TẠO BIẾN TOÀN CỤC ---
    let originalData = []; // Dữ liệu gốc từ API
    let currentData = [];  // Dữ liệu sau khi filter/sort
    let currentPage = 1;
    let itemsPerPage = 10;
    
    // Cấu hình sắp xếp mặc định
    let sortConfig = { key: null, direction: 'asc' }; 

    // --- 2. HÀM GET ALL (LOAD DATA) ---
    async function getAll() {
        try {
            // Fetch dữ liệu từ API
            let res = await fetch('https://api.escuelajs.co/api/v1/products');
            let data = await res.json();
            
            // Lưu vào biến gốc và biến hiện tại
            originalData = data;
            currentData = [...originalData];

            // Render lần đầu
            renderTable();
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
            document.getElementById('tableBody').innerHTML = "<tr><td colspan='5'>Lỗi tải dữ liệu. Bật F12 xem Console.</td></tr>";
        }
    }

    // --- 3. HÀM RENDER BẢNG (CORE LOGIC) ---
    function renderTable() {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = "";

        // A. Logic Phân trang (Pagination)
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const dataToDisplay = currentData.slice(startIndex, endIndex);

        // B. Render HTML
        if (dataToDisplay.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:red'>Không tìm thấy dữ liệu</td></tr>";
            renderPagination();
            return;
        }

        let html = "";
        for (const item of dataToDisplay) {
            // Xử lý hiển thị toàn bộ hình ảnh
            let imagesHtml = `<div class="img-list">`;
            if (item.images && item.images.length > 0) {
                item.images.forEach(imgUrl => {
                    // API này thỉnh thoảng trả về link ảnh dạng chuỗi JSON bị lỗi ["..."], cần clean
                    let cleanUrl = imgUrl.replace(/["\[\]]/g, ''); 
                    // Kiểm tra nếu url hợp lệ mới hiện
                    if(cleanUrl.startsWith('http')) {
                        imagesHtml += `<img src="${cleanUrl}" class="product-img" onerror="this.style.display='none'">`;
                    }
                });
            }
            imagesHtml += `</div>`;

            html += `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.title}</td>
                    <td>$${item.price}</td>
                    <td>${item.category ? item.category.name : 'N/A'}</td>
                    <td>${imagesHtml}</td>
                </tr>
            `;
        }
        tableBody.innerHTML = html;

        // C. Gọi hàm vẽ nút phân trang
        renderPagination();
    }

    // --- 4. HÀM RENDER NÚT PHÂN TRANG ---
    function renderPagination() {
        const paginationDiv = document.getElementById('pagination');
        paginationDiv.innerHTML = "";
        const totalPages = Math.ceil(currentData.length / itemsPerPage);

        if (totalPages <= 1) return; // Nếu chỉ có 1 trang thì không cần hiện nút

        // Nút Previous
        if(currentPage > 1) {
            paginationDiv.innerHTML += `<button onclick="changePage(${currentPage - 1})">Prev</button>`;
        }

        // Logic hiển thị số trang rút gọn (để tránh bị tràn nếu quá nhiều trang)
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        // Luôn hiện trang 1 nếu đang ở xa
        if (startPage > 1) {
            paginationDiv.innerHTML += `<button onclick="changePage(1)">1</button>`;
            if (startPage > 2) paginationDiv.innerHTML += `<span>...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            paginationDiv.innerHTML += `<button class="${activeClass}" onclick="changePage(${i})">${i}</button>`;
        }

        // Luôn hiện trang cuối nếu đang ở xa
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) paginationDiv.innerHTML += `<span>...</span>`;
            paginationDiv.innerHTML += `<button onclick="changePage(${totalPages})">${totalPages}</button>`;
        }

        // Nút Next
        if(currentPage < totalPages) {
            paginationDiv.innerHTML += `<button onclick="changePage(${currentPage + 1})">Next</button>`;
        }
    }

    // --- 5. CÁC HÀM XỬ LÝ SỰ KIỆN ---

    // Chuyển trang
    function changePage(page) {
        currentPage = page;
        renderTable();
    }

    // Thay đổi số dòng hiển thị (5, 10, 20)
    function handlePageSizeChange() {
        itemsPerPage = parseInt(document.getElementById('pageSizeSelect').value);
        currentPage = 1; // Reset về trang 1
        renderTable();
    }

    // Tìm kiếm (Search onChange)
    function handleSearch() {
        const keyword = document.getElementById('searchInput').value.toLowerCase();
        
        // Lọc từ dữ liệu gốc
        currentData = originalData.filter(item => 
            item.title.toLowerCase().includes(keyword)
        );

        // Reset sort và page khi tìm kiếm
        currentPage = 1;
        renderTable();
    }

    // Sắp xếp (Sort)
    function handleSort(key) {
        // Đảo chiều nếu click lại vào cùng 1 cột
        if (sortConfig.key === key) {
            sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            sortConfig.key = key;
            sortConfig.direction = 'asc';
        }

        // Cập nhật UI header (xoá class cũ, thêm class mới để hiện mũi tên)
        document.querySelectorAll('th').forEach(th => th.className = '');
        const currentHeader = document.querySelector(`th[onclick="handleSort('${key}')"]`);
        if(currentHeader) currentHeader.classList.add(sortConfig.direction);

        // Logic sắp xếp
        currentData.sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            // Nếu là chuỗi thì dùng localeCompare
            if (typeof valA === 'string') {
                return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            // Nếu là số
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        });

        renderTable();
    }

    // --- 6. CHẠY HÀM KHI LOAD TRANG ---
    getAll();

