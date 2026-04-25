namespace TravelBackend.Domain.Models.Hotel
{
    public class HotelDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int DestinationId { get; set; }
        public decimal PricePerNight { get; set; }
        public double Rating { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
    }
}
