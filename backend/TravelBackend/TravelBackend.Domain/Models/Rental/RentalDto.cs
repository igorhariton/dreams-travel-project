namespace TravelBackend.Domain.Models.Rental
{
    public class RentalDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RentalType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int DestinationId { get; set; }
        public decimal PricePerDay { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
    }
}
