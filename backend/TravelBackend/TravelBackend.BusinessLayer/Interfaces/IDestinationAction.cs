using TravelBackend.Domain.Models.Destination;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Interfaces
{
    public interface IDestinationAction
    {
        List<DestinationDto> GetAllDestinationsAction();
        DestinationDto? GetDestinationByIdAction(int id);
        ActionResponce CreateDestinationAction(DestinationDto data);
        ActionResponce UpdateDestinationAction(DestinationDto data);
        ActionResponce DeleteDestinationAction(int id);
    }
}
