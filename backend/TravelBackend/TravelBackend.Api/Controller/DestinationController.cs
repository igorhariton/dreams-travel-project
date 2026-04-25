using Microsoft.AspNetCore.Mvc;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.Destination;

namespace TravelBackend.Api.Controller
{
    [Route("api/destination")]
    [ApiController]
    public class DestinationController : ControllerBase
    {
        private readonly IDestinationAction _destination;

        public DestinationController()
        {
            var bl = new BusinessLayer.BusinessLogic();
            _destination = bl.DestinationAction();
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var destinations = _destination.GetAllDestinationsAction();
            return Ok(destinations);
        }

        [HttpGet]
        public IActionResult Get(int id)
        {
            var destination = _destination.GetDestinationByIdAction(id);
            return Ok(destination);
        }

        [HttpPost]
        public IActionResult Create([FromBody] DestinationDto data)
        {
            var responce = _destination.CreateDestinationAction(data);
            return Ok(responce);
        }

        [HttpPut]
        public IActionResult Update([FromBody] DestinationDto data)
        {
            var responce = _destination.UpdateDestinationAction(data);
            return Ok(responce);
        }

        [HttpDelete]
        public IActionResult Delete(int id)
        {
            var responce = _destination.DeleteDestinationAction(id);
            return Ok(responce);
        }
    }
}
