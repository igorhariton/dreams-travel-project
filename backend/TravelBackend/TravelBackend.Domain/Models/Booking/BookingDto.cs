namespace TravelBackend.Domain.Models.Booking
{
    public class BookingDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string ListingType { get; set; } = string.Empty;
        public int ListingId { get; set; }
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public int Guests { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
