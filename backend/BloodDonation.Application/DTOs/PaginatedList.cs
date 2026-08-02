namespace BloodDonation.Application.DTOs;

using System.Collections.Generic;

public class PaginatedList<T>
{
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (TotalCount + PageSize - 1) / PageSize : 0;
}
