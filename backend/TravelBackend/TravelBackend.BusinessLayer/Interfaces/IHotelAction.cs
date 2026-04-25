using TravelBackend.Domain.Models.Hotel;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Interfaces
{
    public interface IHotelAction
    {
        List<HotelDto> GetAllHotelsAction();
        HotelDto? GetHotelByIdAction(int id);
        ActionResponce CreateHotelAction(HotelDto data);
        ActionResponce UpdateHotelAction(HotelDto data);
        ActionResponce DeleteHotelAction(int id);
    }
}
