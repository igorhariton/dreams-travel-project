using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.BusinessLayer.Structure;

namespace TravelBackend.BusinessLayer
{
    public class BusinessLogic
    {
        public BusinessLogic() { }

        public IUserLoginAction UserLoginAction()
        {
            return new UserAuthAction();
        }

        public IUserRegAction UserRegAction()
        {
            return new UserRegActionExecution();
        }

        public IDestinationAction DestinationAction()
        {
            return new DestinationActionExecution();
        }

        public IHotelAction HotelAction()
        {
            return new HotelActionExecution();
        }

        public IRentalAction RentalAction()
        {
            return new RentalActionExecution();
        }

        public IBookingAction BookingAction()
        {
            return new BookingActionExecution();
        }

        public IFavoriteAction FavoriteAction()
        {
            return new FavoriteActionExecution();
        }

        public IPlannerTripAction PlannerTripAction()
        {
            return new PlannerTripActionExecution();
        }
    }
}
