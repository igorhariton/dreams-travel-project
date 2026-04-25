using TravelBackend.BusinessLayer.Core;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.Destination;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Structure
{
    public class DestinationActionExecution : DestinationActions, IDestinationAction
    {
        public ActionResponce CreateDestinationAction(DestinationDto data)
        {
            return CreateDestinationActionExecution(data);
        }

        public ActionResponce DeleteDestinationAction(int id)
        {
            return DeleteDestinationActionExecution(id);
        }

        public List<DestinationDto> GetAllDestinationsAction()
        {
            return GetAllDestinationsActionExecution();
        }

        public DestinationDto? GetDestinationByIdAction(int id)
        {
            return GetDestinationByIdActionExecution(id);
        }

        public ActionResponce UpdateDestinationAction(DestinationDto data)
        {
            return UpdateDestinationActionExecution(data);
        }
    }
}
