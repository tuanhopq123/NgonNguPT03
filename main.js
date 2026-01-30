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

        // --- 3. RENDER TABLE (ĐÃ CÓ XỬ LÝ ẢNH & LINK) ---
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
                
                // Xử lý dữ liệu ảnh (Clean JSON rác)
                let processedImages = item.images;
                if (typeof processedImages === 'string') {
                    try { processedImages = JSON.parse(processedImages); } catch (e) { processedImages = []; }
                }
                if (Array.isArray(processedImages) && processedImages.length > 0 && typeof processedImages[0] === 'string' && processedImages[0].startsWith('[')) {
                     try { processedImages = JSON.parse(processedImages[0]); } catch (e) {}
                }

                // Tạo HTML ảnh
                let imagesHtml = `<div class="img-list">`;
                if (Array.isArray(processedImages) && processedImages.length > 0) {
                    processedImages.forEach(imgUrl => {
                        let cleanUrl = imgUrl.replace(/["\[\]]/g, '');
                        if (cleanUrl.startsWith('http')) {
                            // Link bao ngoài ảnh: Nếu ảnh lỗi -> Hiện ô đỏ -> Bấm vào ô đỏ vẫn mở link gốc
                            imagesHtml += `
                                <a href="${cleanUrl}" target="_blank" title="Click mở link gốc">
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