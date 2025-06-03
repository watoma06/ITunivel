import React from 'react';

const Filter = ({ filterClient, setFilterClient }) => {
  return (
    <div className="filter-todos">
      <h3>Filter Todos</h3>
      <input
        type="text"
        placeholder="Filter by client name..."
        value={filterClient}
        onChange={(e) => setFilterClient(e.target.value)}
      />
    </div>
  );
};

export default Filter;
