using TravelBackend.BusinessLayer.Core;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.Rental;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Structure
{
    public class RentalActionExecution : RentalActions, IRentalAction
    {
        public ActionResponce CreateRentalAction(RentalDto data)
        {
            return CreateRentalActionExecution(data);
        }

        public ActionResponce DeleteRentalAction(int id)
        {
            return DeleteRentalActionExecution(id);
        }

        public List<RentalDto> GetAllRentalsAction()
        {
            return GetAllRentalsActionExecution();
        }

        public RentalDto? GetRentalByIdAction(int id)
        {
            return GetRentalByIdActionExecution(id);
        }

        public ActionResponce UpdateRentalAction(RentalDto data)
        {
            return UpdateRentalActionExecution(data);
        }
    }
}
