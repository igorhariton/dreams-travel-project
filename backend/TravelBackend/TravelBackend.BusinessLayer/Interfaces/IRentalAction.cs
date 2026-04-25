using TravelBackend.Domain.Models.Rental;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Interfaces
{
    public interface IRentalAction
    {
        List<RentalDto> GetAllRentalsAction();
        RentalDto? GetRentalByIdAction(int id);
        ActionResponce CreateRentalAction(RentalDto data);
        ActionResponce UpdateRentalAction(RentalDto data);
        ActionResponce DeleteRentalAction(int id);
    }
}
