import { useState, useEffect } from "react";

export default function useTable(data, searchTerm, searchFields, rowsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter
  const filteredData = data.filter((item) =>
    searchFields.some((field) =>
      item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    currentRows,
  };
}