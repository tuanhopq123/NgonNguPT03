        // --- 1. KHỞI TẠO ---
        let originalData = [];
        let currentData = [];
        let currentPage = 1;
        let itemsPerPage = 10;
        let sortConfig = { key: null, direction: 'asc' }; 

        // --- 2. GET ALL ---
        async function getAll() {
            try {
                let res = await fetch('https://api.escuelajs.co/api/v1/products');
                let data = await res.json();
                originalData = data;
                currentData = [...originalData];
                renderTable();
            } catch (error) {
                console.error(error);
            }
        }

        // --- 3. HÀM RENDER BẢNG (CẬP NHẬT: HIỂN THỊ CẢ ẢNH CATEGORY) ---
    function renderTable() {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = "";

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const dataToDisplay = currentData.slice(startIndex, endIndex);

        if (dataToDisplay.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:red'>Không tìm thấy dữ liệu</td></tr>";
            renderPagination();
            return;
        }

        let html = "";
        for (const item of dataToDisplay) {
            
            // --- BƯỚC 1: TẠO MỘT DANH SÁCH CHỨA TẤT CẢ ẢNH ---
            let allImages = [];

            // 1.1. Lấy ảnh Category (nếu có) đưa vào đầu danh sách
            if (item.category && item.category.image) {
                allImages.push(item.category.image);
            }

            // 1.2. Xử lý và lấy danh sách ảnh sản phẩm (item.images)
            let productImages = item.images;
            
            // Fix lỗi JSON rác của API
            if (typeof productImages === 'string') {
                try { productImages = JSON.parse(productImages); } catch (e) { productImages = []; }
            }
            if (Array.isArray(productImages) && productImages.length > 0 && typeof productImages[0] === 'string' && productImages[0].startsWith('[')) {
                 try { productImages = JSON.parse(productImages[0]); } catch (e) {}
            }

            // Gộp ảnh sản phẩm vào danh sách chung
            if (Array.isArray(productImages)) {
                allImages = allImages.concat(productImages);
            }

            // --- BƯỚC 2: TẠO HTML TỪ DANH SÁCH TỔNG HỢP ---
            let imagesHtml = `<div class="img-list">`;
            
            if (allImages.length > 0) {
                allImages.forEach((imgUrl, index) => {
                    // Clean URL
                    let cleanUrl = imgUrl.replace(/["\[\]]/g, '');
                    
                    if (cleanUrl.startsWith('http')) {
                        // Logic hiển thị: Ảnh đầu tiên (index 0) thường là Category, ta có thể thêm viền màu khác nếu thích
                        // Ở đây tôi để hiển thị giống nhau
                        imagesHtml += `
                            <a href="${cleanUrl}" target="_blank" title="${index === 0 ? 'Ảnh Category' : 'Ảnh sản phẩm'}">
                                <img src="${cleanUrl}" 
                                     class="product-img" 
                                     alt="img"
                                     onerror="this.onerror=null; this.src='https://placehold.co/50/ff0000/FFFFFF?text=Link';">
                            </a>
                        `;
                    }
                });
            } else {
                imagesHtml += `<span style="color:gray; font-size:12px">No Image</span>`;
            }
            imagesHtml += `</div>`;
            // -------------------------------

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
        renderPagination();
    }

        // --- 4. PAGINATION ---
        function renderPagination() {
            const paginationDiv = document.getElementById('pagination');
            paginationDiv.innerHTML = "";
            const totalPages = Math.ceil(currentData.length / itemsPerPage);

            if (totalPages <= 1) return;

            if(currentPage > 1) paginationDiv.innerHTML += `<button onclick="changePage(${currentPage - 1})">Prev</button>`;

            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, currentPage + 2);

            if (startPage > 1) paginationDiv.innerHTML += `<button onclick="changePage(1)">1</button><span>...</span>`;

            for (let i = startPage; i <= endPage; i++) {
                const activeClass = i === currentPage ? 'active' : '';
                paginationDiv.innerHTML += `<button class="${activeClass}" onclick="changePage(${i})">${i}</button>`;
            }

            if (endPage < totalPages) paginationDiv.innerHTML += `<span>...</span><button onclick="changePage(${totalPages})">${totalPages}</button>`;
            if(currentPage < totalPages) paginationDiv.innerHTML += `<button onclick="changePage(${currentPage + 1})">Next</button>`;
        }

        // --- 5. EVENTS ---
        function changePage(page) { currentPage = page; renderTable(); }
        function handlePageSizeChange() { itemsPerPage = parseInt(document.getElementById('pageSizeSelect').value); currentPage = 1; renderTable(); }
        function handleSearch() {
            const keyword = document.getElementById('searchInput').value.toLowerCase();
            currentData = originalData.filter(item => item.title.toLowerCase().includes(keyword));
            currentPage = 1; renderTable();
        }
        function handleSort(key) {
            if (sortConfig.key === key) sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
            else { sortConfig.key = key; sortConfig.direction = 'asc'; }

            document.querySelectorAll('th').forEach(th => th.className = '');
            document.querySelector(`th[onclick="handleSort('${key}')"]`).classList.add(sortConfig.direction);

            currentData.sort((a, b) => {
                let valA = a[key], valB = b[key];
                if (typeof valA === 'string') return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            });
            renderTable();
        }

        getAll();