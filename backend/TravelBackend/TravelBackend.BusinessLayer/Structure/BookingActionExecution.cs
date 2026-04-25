using TravelBackend.BusinessLayer.Core;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.Booking;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Structure
{
    public class BookingActionExecution : BookingActions, IBookingAction
    {
        public ActionResponce CreateBookingAction(BookingDto data)
        {
            return CreateBookingActionExecution(data);
        }

        public ActionResponce DeleteBookingAction(int id)
        {
            return DeleteBookingActionExecution(id);
        }

        public List<BookingDto> GetAllBookingsAction()
        {
            return GetAllBookingsActionExecution();
        }

        public BookingDto? GetBookingByIdAction(int id)
        {
            return GetBookingByIdActionExecution(id);
        }

        public ActionResponce UpdateBookingAction(BookingDto data)
        {
            return UpdateBookingActionExecution(data);
        }
    }
}
