using Microsoft.AspNetCore.Mvc;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.PlannerTrip;

namespace TravelBackend.Api.Controller
{
    [Route("api/planner")]
    [ApiController]
    public class PlannerTripController : ControllerBase
    {
        private IPlannerTripAction _plannerTrip;

        public PlannerTripController()
        {
            var bl = new BusinessLayer.BusinessLogic();
            _plannerTrip = bl.PlannerTripAction();
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var trips = _plannerTrip.GetAllPlannerTripsAction();
            return Ok(trips);
        }

        [HttpGet]
        public IActionResult Get(int id)
        {
            var trip = _plannerTrip.GetPlannerTripByIdAction(id);
            return Ok(trip);
        }

        [HttpPost]
        public IActionResult Create([FromBody] PlannerTripDto data)
        {
            var responce = _plannerTrip.CreatePlannerTripAction(data);
            return Ok(responce);
        }

        [HttpPut]
        public IActionResult Update([FromBody] PlannerTripDto data)
        {
            var responce = _plannerTrip.UpdatePlannerTripAction(data);
            return Ok(responce);
        }

        [HttpDelete]
        public IActionResult Delete(int id)
        {
            var responce = _plannerTrip.DeletePlannerTripAction(id);
            return Ok(responce);
        }
    }
}
