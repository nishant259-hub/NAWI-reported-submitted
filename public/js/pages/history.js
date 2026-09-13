function filterTable() {
    const searchInput = document.getElementById('searchInput').value.toUpperCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const resultFilter = document.getElementById('filterResult').value; // In this UI, Status and Result are mostly the same
    const dateFilter = document.getElementById('filterDate').value;
    const classFilter = document.getElementById('filterClass').value;
    
    const tr = document.getElementById('historyTable').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    
    for (let i = 0; i < tr.length; i++) {
        if (tr[i].getElementsByTagName('td').length === 1) continue; // Skip empty row
        
        const searchable = tr[i].getAttribute('data-search');
        const rowStatus = tr[i].getAttribute('data-status');
        const rowDate = tr[i].getAttribute('data-date');
        const rowClass = tr[i].getAttribute('data-class');
        
        let match = true;
        
        if (searchInput && !searchable.includes(searchInput)) match = false;
        if (statusFilter && rowStatus !== statusFilter) match = false;
        if (resultFilter && rowStatus !== resultFilter) match = false;
        if (dateFilter && rowDate !== dateFilter) match = false;
        if (classFilter && rowClass !== classFilter && rowClass !== "class " + classFilter && rowClass !== "Class " + classFilter) match = false;
        
        tr[i].style.display = match ? "" : "none";
    }
}
