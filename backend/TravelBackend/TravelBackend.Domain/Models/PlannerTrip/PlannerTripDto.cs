namespace TravelBackend.Domain.Models.PlannerTrip
{
    public class PlannerTripDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int DestinationId { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Notes { get; set; } = string.Empty;
    }
}
