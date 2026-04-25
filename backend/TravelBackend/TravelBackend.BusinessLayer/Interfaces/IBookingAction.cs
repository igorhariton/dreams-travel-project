using TravelBackend.Domain.Models.Booking;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Interfaces
{
    public interface IBookingAction
    {
        List<BookingDto> GetAllBookingsAction();
        BookingDto? GetBookingByIdAction(int id);
        ActionResponce CreateBookingAction(BookingDto data);
        ActionResponce UpdateBookingAction(BookingDto data);
        ActionResponce DeleteBookingAction(int id);
    }
}
