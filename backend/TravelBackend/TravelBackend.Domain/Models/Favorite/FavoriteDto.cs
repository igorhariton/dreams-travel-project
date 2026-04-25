namespace TravelBackend.Domain.Models.Favorite
{
    public class FavoriteDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string ListingType { get; set; } = string.Empty;
        public int ListingId { get; set; }
    }
}
