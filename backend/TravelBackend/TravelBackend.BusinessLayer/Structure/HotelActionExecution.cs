using TravelBackend.BusinessLayer.Core;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.Hotel;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Structure
{
    public class HotelActionExecution : HotelActions, IHotelAction
    {
        public ActionResponce CreateHotelAction(HotelDto data)
        {
            return CreateHotelActionExecution(data);
        }

        public ActionResponce DeleteHotelAction(int id)
        {
            return DeleteHotelActionExecution(id);
        }

        public List<HotelDto> GetAllHotelsAction()
        {
            return GetAllHotelsActionExecution();
        }

        public HotelDto? GetHotelByIdAction(int id)
        {
            return GetHotelByIdActionExecution(id);
        }

        public ActionResponce UpdateHotelAction(HotelDto data)
        {
            return UpdateHotelActionExecution(data);
        }
    }
}
